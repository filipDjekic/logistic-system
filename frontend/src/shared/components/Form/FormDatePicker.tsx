import { TextField, type TextFieldProps } from '@mui/material';
import {
  useController,
  type Control,
  type FieldPath,
  type FieldValues,
  type RegisterOptions,
} from 'react-hook-form';

type NativeDateInputType = 'date' | 'datetime-local' | 'time';

type FormDatePickerProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> = Omit<
  TextFieldProps,
  'name' | 'value' | 'defaultValue' | 'onChange' | 'error' | 'helperText' | 'type'
> & {
  name: TName;
  control: Control<TFieldValues>;
  rules?: RegisterOptions<TFieldValues, TName>;
  helperText?: TextFieldProps['helperText'];
  inputType?: NativeDateInputType;
};

export default function FormDatePicker<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>({
  name,
  control,
  rules,
  helperText,
  inputType = 'datetime-local',
  required,
  InputLabelProps,
  ...textFieldProps
}: FormDatePickerProps<TFieldValues, TName>) {
  const { field, fieldState } = useController({
    name,
    control,
    rules,
  });

  return (
    <TextField
      {...textFieldProps}
      {...field}
      type={inputType}
      required={required}
      fullWidth={textFieldProps.fullWidth ?? true}
      value={field.value ?? ''}
      error={Boolean(fieldState.error)}
      helperText={fieldState.error?.message ?? helperText}
      InputLabelProps={{
        shrink: true,
        ...InputLabelProps,
      }}
    />
  );
}