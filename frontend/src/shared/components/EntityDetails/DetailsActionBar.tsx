import type { ReactNode } from 'react';
import { Button, Stack } from '@mui/material';
import type { ButtonProps } from '@mui/material/Button';
import { Link as RouterLink } from 'react-router-dom';

type DetailsAction = {
  key?: string;
  label: ReactNode;
  onClick?: ButtonProps['onClick'];
  to?: string;
  href?: string;
  icon?: ReactNode;
  disabled?: boolean;
  variant?: ButtonProps['variant'];
  color?: ButtonProps['color'];
  size?: ButtonProps['size'];
  type?: ButtonProps['type'];
};

type DetailsActionBarProps = {
  actions?: DetailsAction[];
  children?: ReactNode;
  align?: 'start' | 'end';
  dense?: boolean;
};

export default function DetailsActionBar({ actions, children, align = 'end', dense = false }: DetailsActionBarProps) {
  if ((!actions || actions.length === 0) && !children) {
    return null;
  }

  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={1}
      flexWrap="wrap"
      useFlexGap
      justifyContent={{ xs: 'stretch', sm: align === 'end' ? 'flex-end' : 'flex-start' }}
      sx={{
        width: { xs: '100%', sm: 'auto' },
        '& > *': { width: { xs: '100%', sm: 'auto' } },
      }}
    >
      {actions?.map((action) => {
        const buttonProps: ButtonProps & { component?: React.ElementType; to?: string; href?: string } = {
          variant: action.variant ?? 'outlined',
          color: action.color ?? 'primary',
          size: action.size ?? (dense ? 'small' : 'medium'),
          disabled: action.disabled,
          onClick: action.onClick,
          startIcon: action.icon,
          type: action.type,
        };

        if (action.to) {
          buttonProps.component = RouterLink;
          buttonProps.to = action.to;
        }

        if (action.href) {
          buttonProps.component = 'a';
          buttonProps.href = action.href;
        }

        return (
          <Button key={action.key ?? String(action.label)} {...buttonProps}>
            {action.label}
          </Button>
        );
      })}
      {children}
    </Stack>
  );
}

export type { DetailsAction, DetailsActionBarProps };
