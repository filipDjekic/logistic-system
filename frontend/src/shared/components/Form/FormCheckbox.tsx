import {
  Checkbox,
  FormControl,
  FormControlLabel,
  FormHelperText,
  type CheckboxProps,
  type FormControlProps,
} from '@mui/material';
import {
  useController,
  type Control,
  type FieldPath,
  type FieldValues,
  type RegisterOptions,
} from 'react-hook-form';

type FormCheckboxProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> = Omit<CheckboxProps, 'name' | 'checked' | 'defaultChecked' | 'onChange'> & {
  name: TName;
  control: Control<TFieldValues>;
  label: string;
  rules?: RegisterOptions<TFieldValues, TName>;
  helperText?: string;
  formControlProps?: FormControlProps;
};

export default function FormCheckbox<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>({
  name,
  control,
  label,
  rules,
  helperText,
  formControlProps,
  ...checkboxProps
}: FormCheckboxProps<TFieldValues, TName>) {
  const { field, fieldState } = useController({
    name,
    control,
    rules,
  });

  return (
    <FormControl {...formControlProps} error={Boolean(fieldState.error)}>
      <FormControlLabel
        control={
          <Checkbox
            {...checkboxProps}
            checked={Boolean(field.value)}
            onChange={(_, checked) => field.onChange(checked)}
            onBlur={field.onBlur}
            inputRef={field.ref}
          />
        }
        label={label}
      />

      <FormHelperText>{fieldState.error?.message ?? helperText}</FormHelperText>
    </FormControl>
  );
}