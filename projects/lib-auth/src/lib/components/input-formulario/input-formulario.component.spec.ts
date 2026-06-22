import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComponenteEntradaFormulario } from './input-formulario.component';

describe('ComponenteEntradaFormulario', () => {
  let fixture: ComponentFixture<ComponenteEntradaFormulario>;
  let componente: ComponenteEntradaFormulario;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComponenteEntradaFormulario],
    }).compileComponents();

    fixture    = TestBed.createComponent(ComponenteEntradaFormulario);
    componente = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debería crear el componente', () => {
    expect(componente).toBeTruthy();
  });

  // ── writeValue ─────────────────────────────────────────────────────────────

  it('writeValue() debería asignar el valor recibido', () => {
    componente.writeValue('hola');
    expect(componente.value).toBe('hola');
  });

  it('writeValue() debería usar cadena vacía cuando recibe null', () => {
    componente.writeValue(null);
    expect(componente.value).toBe('');
  });

  // ── ControlValueAccessor ───────────────────────────────────────────────────

  it('registerOnChange() debería registrar la función de callback', () => {
    const fn = jasmine.createSpy('onChange');
    componente.registerOnChange(fn);
    componente.onChange('valor');
    expect(fn).toHaveBeenCalledWith('valor');
  });

  it('registerOnTouched() debería registrar la función de callback', () => {
    const fn = jasmine.createSpy('onTouched');
    componente.registerOnTouched(fn);
    componente.onTouched();
    expect(fn).toHaveBeenCalled();
  });

  it('setDisabledState() debería actualizar la propiedad disabled', () => {
    componente.setDisabledState(true);
    expect(componente.disabled).toBeTrue();

    componente.setDisabledState(false);
    expect(componente.disabled).toBeFalse();
  });

  // ── onInput — rama esRut=false ────────────────────────────────────────────

  it('onInput() debería actualizar el valor cuando esRut es false', () => {
    const fn = jasmine.createSpy('onChange');
    componente.registerOnChange(fn);
    componente.esRut = false;

    const evento = { target: { value: 'texto libre' } } as unknown as Event;
    componente.onInput(evento);

    expect(componente.value).toBe('texto libre');
    expect(fn).toHaveBeenCalledWith('texto libre');
  });

  // ── onInput — rama esRut=true ─────────────────────────────────────────────

  it('onInput() debería formatear como RUT cuando esRut es true', () => {
    componente.esRut = true;

    const evento = { target: { value: '123456785' } } as unknown as Event;
    componente.onInput(evento);

    // 12.345.678-5
    expect(componente.value).toMatch(/^\d+\.\d+\.\d+-\w$/);
  });

  it('onInput() con esRut=true debería retornar el carácter solo si tiene largo ≤ 1', () => {
    componente.esRut = true;

    const evento = { target: { value: '1' } } as unknown as Event;
    componente.onInput(evento);

    expect(componente.value).toBe('1');
  });

  // ── onFocus / onBlur ───────────────────────────────────────────────────────

  it('onFocus() debería marcar isFocused como true', () => {
    componente.onFocus();
    expect(componente.isFocused).toBeTrue();
  });

  it('onBlur() debería marcar isFocused como false y llamar onTouched', () => {
    const fn = jasmine.createSpy('onTouched');
    componente.registerOnTouched(fn);
    componente.isFocused = true;

    componente.onBlur();

    expect(componente.isFocused).toBeFalse();
    expect(fn).toHaveBeenCalled();
  });

  // ── hasError ──────────────────────────────────────────────────────────────

  it('hasError debería ser false cuando error es null', () => {
    componente.error = null;
    expect(componente.hasError).toBeFalse();
  });

  it('hasError debería ser true cuando hay un mensaje de error', () => {
    componente.error = 'Campo requerido';
    expect(componente.hasError).toBeTrue();
  });

  // ── inputClasses ──────────────────────────────────────────────────────────

  it('inputClasses debería incluir solo form-control en estado neutro', () => {
    componente.isFocused = false;
    componente.error     = null;
    expect(componente.inputClasses).toBe('form-control');
  });

  it('inputClasses debería incluir is-focused cuando el campo tiene foco', () => {
    componente.isFocused = true;
    componente.error     = null;
    expect(componente.inputClasses).toContain('is-focused');
  });

  it('inputClasses debería incluir is-invalid cuando hay error', () => {
    componente.isFocused = false;
    componente.error     = 'Error';
    expect(componente.inputClasses).toContain('is-invalid');
  });

  it('inputClasses debería incluir ambas clases cuando hay foco y error', () => {
    componente.isFocused = true;
    componente.error     = 'Error';
    const clases = componente.inputClasses;
    expect(clases).toContain('is-focused');
    expect(clases).toContain('is-invalid');
  });
});
