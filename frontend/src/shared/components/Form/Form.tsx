import { TextField, type TextFieldProps } from '@mui/material';
import {
  useController,
  type Control,
  type FieldPath,
  type FieldValues,
  type RegisterOptions,
} from 'react-hook-form';

type FormTextFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> = Omit<
  TextFieldProps,
  'name' | 'value' | 'defaultValue' | 'onChange' | 'error' | 'helperText'
> & {
  name: TName;
  control: Control<TFieldValues>;
  rules?: RegisterOptions<TFieldValues, TName>;
  helperText?: TextFieldProps['helperText'];
};

export default function FormTextField<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>({
  name,
  control,
  rules,
  helperText,
  required,
  ...textFieldProps
}: FormTextFieldProps<TFieldValues, TName>) {
  const { field, fieldState } = useController({
    name,
    control,
    rules,
  });

  return (
    <TextField
      {...textFieldProps}
      {...field}
      required={required}
      fullWidth={textFieldProps.fullWidth ?? true}
      value={field.value ?? ''}
      error={Boolean(fieldState.error)}
      helperText={fieldState.error?.message ?? helperText}
    />
  );
}