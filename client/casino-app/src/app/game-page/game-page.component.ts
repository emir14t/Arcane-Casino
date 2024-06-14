import { Component, OnInit } from '@angular/core';
import { HttpServiceService } from '../http-service.service';
import { AuthService } from '../auth.service';
import { ActivatedRoute, Router } from '@angular/router';

const RED_NUMBERS: number[] = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

@Component({
  selector: 'app-game-page',
  templateUrl: './game-page.component.html',
  styleUrls: ['./game-page.component.scss']
})
export class GamePageComponent implements OnInit {
  private spinInterval!: ReturnType<typeof setInterval>;
  private initialRotationSpeed = 100;
  private decelerationRate = 0.95;

  result: string = '...';
  color: string = '';
  balance: number = NaN;
  username: string = '';
  selectedNumber: number = 0;
  bid: number = 0.01
  delta: number = 0.0

  constructor(
    private authService: AuthService,
    private communicationService: HttpServiceService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      this.route.queryParams.subscribe(params => {
        this.username = params['key'];
      });

      const status = await this.authService.isLoggedIn(this.username);
      if (!status) {
        this.router.navigate(['/home']);
      }
    } catch (e) {
      this.router.navigate(['/home']);
    }
    const data = await new Promise<String>((resolve) => {
      this.communicationService.getWithAuth('account', `username=${encodeURIComponent(this.username)}`).subscribe({
        next: (res) => {
            let response: String = res || ''
            resolve(response);
        },
        error: () => {
            resolve('');
        },
      });
    });
    this.balance = JSON.parse(JSON.stringify(data))['sold']

  }

  spin(): void {
    if (this.bid <= 0 || this.bid > this.balance) return

    this.delta = 0.0
    this.result = '...'
    this.color = ''
    const ball = document.getElementById('ball');
    ball!.classList.remove('fall');
    ball!.style.transition = 'transform 0s';
    void ball!.offsetWidth;

    clearInterval(this.spinInterval);

    let rotation = 0;

    this.spinInterval = setInterval(() => {
      rotation += this.initialRotationSpeed;
      ball!.style.transform = `rotate(${rotation}deg) translateX(-900%) translateY(0)`;

      this.initialRotationSpeed *= this.decelerationRate;

      if (this.initialRotationSpeed < 1) {
        clearInterval(this.spinInterval);
        this.settle();
      }
    }, 10);
  }

  private async settle(): Promise<void> {
    const ball = document.getElementById('ball');
    ball!.style.transition = 'transform 16s cubic-bezier(0.1, 0.8, 0.75, 0.9)';

    const spin = await new Promise<String>((resolve) => {
      const bet = {
        'bid': this.bid,
        'number': this.selectedNumber,
        'username': this.username
      };
      this.communicationService.postWithAuth('spin_wheel', bet).subscribe({
        next: (res) => {
            const result = res.body || ''
            resolve(result)
        },
        error: () => {
          resolve('')
        }
      });
    });

    const spinOBJ: { [key: string]: any } = JSON.parse(spin.toString());
    const number: number = spinOBJ['random-number'];

    ball!.style.transform = `rotate(${-3600}deg) translateX(-900%) translateY(0)`;

    setTimeout(() => {
      this.waitForIntersection(number, spinOBJ)
    }, 10000);
  }

  private async waitForIntersection(number: number, spin: any): Promise<void> {
    const ball = document.getElementById('ball');
    if (!ball) return;

    while (!this.isIntersect(number)) {
      await this.delay(1);
    }

    await this.delay(80);

    console.log('Intersection with ', number, this.getNthElement(number));


    ball.style.transform = getComputedStyle(ball).transform;

    ball!.style.transition = 'transform 2s ease-in';
    ball!.style.transform = `translateX(0%) translateY(0%)`;

    setTimeout(() => {
      ball.style.transform = getComputedStyle(ball).transform;
      ball!.style.transition = 'none';
    }, 900);

    this.result = number.toString();
    this.color = number == 0 ? 'GREEN' : RED_NUMBERS.includes(number) ? 'RED' : 'BLACK'
    this.initialRotationSpeed = 100;
    this.delta = Math.round((spin['new-balance'] - this.balance) * 100) / 100;
    this.balance = Math.round(spin['new-balance'] * 100) / 100;
    this.bid = 0.01;
  }

  private isIntersect(number: number): boolean {
    const ball = document.getElementById('ball');
    let liElement: Element | null = this.getNthElement(number)

    if (!liElement) {
      return false
    }

    const rect = liElement.getBoundingClientRect();
    const ballRect = ball!.getBoundingClientRect();

    const nthElementCenterX = (rect.left + rect.right) / 2;
    const nthElementCenterY = (rect.top + rect.bottom) / 2;

    const ballCenterX = (ballRect.left + ballRect.right) / 2;
    const ballCenterY = (ballRect.top + ballRect.bottom) / 2;

    const tolerance = 72;

    const isIntersect = ((ballCenterX - nthElementCenterX) * (ballCenterX - nthElementCenterX)) +
                        ((ballCenterY - nthElementCenterY) * (ballCenterY - nthElementCenterY)) <= tolerance * tolerance

    return isIntersect;

  }

  private getNthElement(number: number) : Element | null {
    const ulElement = document.getElementById('inner');
    const liElements = ulElement!.querySelectorAll('.number');

    for (let i = 0; i < liElements.length; i++) {
      const value = parseInt(liElements[i].getAttribute('value')!, 10);
      if (value === number) {
        return liElements[i]
      }
    }
    return null
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
