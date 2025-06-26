import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MisTurnosPacienteComponent } from './mis-turnos-paciente.component';

describe('MisTurnosPacienteComponent', () => {
  let component: MisTurnosPacienteComponent;
  let fixture: ComponentFixture<MisTurnosPacienteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MisTurnosPacienteComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MisTurnosPacienteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
