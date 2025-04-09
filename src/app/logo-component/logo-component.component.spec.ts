import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LogoComponentComponent } from './logo-component.component';

describe('LogoComponentComponent', () => {
  let component: LogoComponentComponent;
  let fixture: ComponentFixture<LogoComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LogoComponentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LogoComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
