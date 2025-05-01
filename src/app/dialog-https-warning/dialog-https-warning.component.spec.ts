import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogHttpsWarningComponent } from './dialog-https-warning.component';

describe('DialogHttpsWarningComponent', () => {
  let component: DialogHttpsWarningComponent;
  let fixture: ComponentFixture<DialogHttpsWarningComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogHttpsWarningComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DialogHttpsWarningComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
