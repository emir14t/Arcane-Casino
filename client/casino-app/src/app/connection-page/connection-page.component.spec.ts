import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConnectionPageComponent } from './connection-page.component';

describe('ConnectionPageComponent', () => {
  let component: ConnectionPageComponent;
  let fixture: ComponentFixture<ConnectionPageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ConnectionPageComponent]
    });
    fixture = TestBed.createComponent(ConnectionPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
