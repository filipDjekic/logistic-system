import {
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  type FormControlProps,
  type SelectProps,
} from '@mui/material';
import {
  useController,
  type Control,
  type FieldPath,
  type FieldValues,
  type RegisterOptions,
} from 'react-hook-form';

export type FormSelectOption = {
  label: string;
  value: string | number;
};

type FormSelectProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> = Omit<SelectProps, 'name' | 'value' | 'defaultValue' | 'onChange' | 'error'> & {
  name: TName;
  control: Control<TFieldValues>;
  label: string;
  options: readonly FormSelectOption[];
  rules?: RegisterOptions<TFieldValues, TName>;
  helperText?: string;
  formControlProps?: FormControlProps;
};

export default function FormSelect<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>({
  name,
  control,
  label,
  options,
  rules,
  helperText,
  required,
  formControlProps,
  fullWidth,
  ...selectProps
}: FormSelectProps<TFieldValues, TName>) {
  const labelId = `${String(name)}-label`;

  const { field, fieldState } = useController({
    name,
    control,
    rules,
  });

  return (
    <FormControl
      {...formControlProps}
      fullWidth={fullWidth ?? true}
      required={required}
      error={Boolean(fieldState.error)}
    >
      <InputLabel id={labelId}>{label}</InputLabel>

      <Select
        {...selectProps}
        {...field}
        labelId={labelId}
        label={label}
        value={field.value ?? ''}
      >
        {options.map((option) => (
          <MenuItem key={`${option.value}`} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>

      <FormHelperText>{fieldState.error?.message ?? helperText}</FormHelperText>
    </FormControl>
  );
}