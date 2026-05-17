import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';

/**
 * ComponenteEntradaFormulario
 * Componente de entrada de texto reutilizable con estilos Bootstrap
 * Implementa ControlValueAccessor para integración con formularios reactivos
 */
@Component({
  selector: 'app-entrada-formulario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './input-formulario.component.html',
  styleUrl: './input-formulario.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ComponenteEntradaFormulario),
      multi: true
    }
  ]
})
export class ComponenteEntradaFormulario implements ControlValueAccessor {
  @Input() label: string = '';
  @Input() name: string = '';
  @Input() placeholder: string = '';
  @Input() type: string = 'text';
  @Input() disabled: boolean = false;
  @Input() error: string | null = null;
  @Input() hint: string = '';
  @Input() required: boolean = false;

  @Output() valueChange = new EventEmitter<string>();

  value: string = '';
  isFocused: boolean = false;

  // ControlValueAccessor methods
  onChange: (value: string) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(value: any): void {
    this.value = value || '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  // Input event handler
  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.value = target.value;
    this.onChange(this.value);
    this.valueChange.emit(this.value);
  }

  onFocus(): void {
    this.isFocused = true;
  }

  onBlur(): void {
    this.isFocused = false;
    this.onTouched();
  }

  get hasError(): boolean {
    return !!this.error;
  }

  get inputClasses(): string {
    const classes = ['form-control'];
    if (this.isFocused) {
      classes.push('is-focused');
    }
    if (this.hasError) {
      classes.push('is-invalid');
    }
    return classes.join(' ');
  }
}
