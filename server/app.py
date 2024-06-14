from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2
from psycopg2.extras import RealDictCursor
import json
import uuid
import functools
from decimal import Decimal
import random


connections: dict = {}

app = Flask(__name__)
CORS(app)

# Database connection configuration
db_config = {
    'host': '127.0.0.1',
    'database': 'casino',
    'user': 'postgres',
    'password': 'qwerty',
    'port': 5556
}

def decimal_default(obj):
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError

def disconnect_db(conn, cursor):
    cursor.close()
    conn.close()

# Initialize the database connection
def get_db_connection():
    conn = psycopg2.connect(**db_config)
    return conn

def verify_get(f):
    @functools.wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            token = request.headers.get('X-Auth-Token')
        except Exception as e:
            return jsonify({'error': 'Unauthorized lol'}), 401
        if not token or token not in connections.values():
            return jsonify({'error': 'Unauthorized lol'}), 401
        return f(*args, **kwargs)
    return decorated_function

def verify_connection(f):
    @functools.wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            token = request.headers.get('X-Auth-Token')
            data = json.loads(request.data.decode('utf-8'))
            user = data['username']
        except Exception as e:
            return jsonify({'error': 'Unauthorized lol'}), 401
        if not token or not user or user not in connections.keys() or connections[user] != token:
            return jsonify({'error': 'Unauthorized lol'}), 401
        return f(*args, **kwargs)
    return decorated_function

@app.route('/connect', methods=['POST'])
def connect():

    data = request.data.decode('utf-8')
    if data is None:
        return jsonify({'error': 'Invalid JSON'}), 400
    
    try:
        data = json.loads(data)
    except json.JSONDecodeError:
        return jsonify({'error': 'Invalid JSON'}), 400

    username = data["username"]
    pw_hash = data["password_hash"]
    
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)

    try:
        cursor.execute("SELECT * FROM users WHERE username = %s AND passwordhash = %s", (username, pw_hash))
        user = cursor.fetchone()
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        disconnect_db(conn, cursor)

    if user:
        session_id = uuid.uuid4()
        connections[username] = f'{session_id}'
        print(connections)
        return jsonify({'id': f'{session_id}'}), 200
    else:
        return jsonify({'error': 'Invalid username or password'}), 401


@app.route('/account', methods=['GET'])
@verify_get
def get_account():
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)

    username = request.args.get('username')

    if username is None:
        disconnect_db(conn, cursor)
        return jsonify({'error': 'Invalid JSON'}), 400

    try:
        cursor.execute("SELECT * FROM accounts WHERE username = %s", (username, ))
        account = cursor.fetchone()
        row_dict = dict(account)
        json_data = json.loads(json.dumps(row_dict, default=decimal_default))
        disconnect_db(conn, cursor)
        return jsonify(json_data)
    
    except json.JSONDecodeError:
        disconnect_db(conn, cursor)
        return jsonify({'error': 'Invalid JSON'}), 400


@app.route('/spin_wheel', methods=['POST'])
@verify_connection
def spin_wheel():
    data = request.data.decode('utf-8')
    if data is None:
        return jsonify({'error': 'Invalid JSON'}), 400
    try:
        data = json.loads(data)
    except json.JSONDecodeError:
        return jsonify({'error': 'Invalid JSON'}), 400

    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        bid = data["bid"]
        number = data["number"]
        user = data['username']
        random_number = random.randint(1, 36)
        # get the users balance
        cursor.execute("SELECT * FROM accounts WHERE username = %s", (user, ))
        account = cursor.fetchone()
        if account is None:
            disconnect_db(conn, cursor)
            return jsonify({'error':  'account does not exist'}), 400
        
        row_dict = dict(account)
        json_data = json.loads(json.dumps(row_dict, default=decimal_default))
        account_sold = json_data["sold"]
        
        if account_sold < bid:
            disconnect_db(conn, cursor)
            return jsonify({'error':  'not enough money money money!'}), 400
                
        if int(number) == random_number:
            gains = round(float(bid) * 35.0) # 36X the money you make
            account_sold += gains
        else:
            account_sold -= float(bid)
        
        cursor.execute("UPDATE accounts SET sold = %s WHERE username = %s", (account_sold, user))
        conn.commit()
        disconnect_db(conn, cursor)
        return jsonify({'new-balance':  account_sold, 'random-number': random_number}), 200

    except Exception as e:
        disconnect_db(conn, cursor)
        return jsonify({'error':  f'{e}'}), 500

@app.route('/sign-up', methods=['POST'])
def sign_up():
    data = request.data.decode('utf-8')
    if data is None:
        return jsonify({'error': 'Invalid JSON'}), 400
    
    try:
        data = json.loads(data)
    except json.JSONDecodeError:
        return jsonify({'error': 'Invalid JSON'}), 400

    username = data["username"]
    pw_hash = data["password_hash"]
    email = data["email"]

    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)

    try:
        cursor.execute("SELECT username FROM users WHERE username = %s", (username,))
        existing_user = cursor.fetchone()
        if existing_user:
            disconnect_db(conn, cursor)
            return jsonify({'error': 'Username is not available!'})
        
        cursor.execute("INSERT INTO users (username, passwordhash) VALUES (%s, %s)", (username, pw_hash))
        cursor.execute("INSERT INTO accounts (username, email, sold) VALUES (%s, %s, %s)", (username, email, 0.00))

        conn.commit()
        
        disconnect_db(conn, cursor)
        return jsonify({'Success!': 'user created!'}), 200

    except Exception as e:
        return jsonify({'error': f'internal server error: {e}'}), 500

@app.route('/ping', methods=['POST'])
@verify_connection
def ping():
    return jsonify({'msg': 'You are connected!'}), 200


@app.route('/', methods=['GET'])
def home():
    return jsonify({'msg': 'Welcome to the Casino API!'}), 200

if __name__ == '__main__':
    print('Starting server...')
    app.run(debug=True)
