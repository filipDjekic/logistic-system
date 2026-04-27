import { alpha, Chip, type ChipProps, useTheme, type Theme } from '@mui/material';
import { getStatusConfig, type StatusTone } from '../../../core/constants/statuses';

type StatusChipProps = {
  value: string | null | undefined;
  size?: ChipProps['size'];
  variant?: 'filled' | 'outlined';
  emphasis?: 'default' | 'strong';
};

function getToneStyles(tone: StatusTone, palette: Theme['palette']) {
  switch (tone) {
    case 'success':
      return {
        color: palette.success.main,
        backgroundColor: alpha(palette.success.main, 0.12),
        borderColor: alpha(palette.success.main, 0.28),
      };

    case 'warning':
      return {
        color: palette.warning.main,
        backgroundColor: alpha(palette.warning.main, 0.12),
        borderColor: alpha(palette.warning.main, 0.28),
      };

    case 'error':
      return {
        color: palette.error.main,
        backgroundColor: alpha(palette.error.main, 0.12),
        borderColor: alpha(palette.error.main, 0.28),
      };

    case 'info':
      return {
        color: palette.info.main,
        backgroundColor: alpha(palette.info.main, 0.12),
        borderColor: alpha(palette.info.main, 0.28),
      };

    case 'primary':
      return {
        color: palette.primary.main,
        backgroundColor: alpha(palette.primary.main, 0.12),
        borderColor: alpha(palette.primary.main, 0.28),
      };

    case 'neutral':
    default:
      return {
        color: palette.text.secondary,
        backgroundColor: alpha(palette.text.primary, 0.06),
        borderColor: alpha(palette.text.primary, 0.12),
      };
  }
}

export default function StatusChip({
  value,
  size = 'small',
  variant = 'filled',
  emphasis = 'default',
}: StatusChipProps) {
  const theme = useTheme();

  if (!value) {
    return null;
  }

  const config = getStatusConfig(value);
  const styles = getToneStyles(config.tone, theme.palette);

  return (
    <Chip
      size={size}
      label={config.label}
      variant={variant}
      sx={{
        fontWeight: 800,
        letterSpacing: 0.2,
        color: styles.color,
        backgroundColor: variant === 'filled' ? styles.backgroundColor : 'transparent',
        borderColor: styles.borderColor,
        borderWidth: 1,
        borderStyle: 'solid',
        minWidth: emphasis === 'strong' ? 118 : undefined,
        justifyContent: 'flex-start',
        '& .MuiChip-label': {
          px: emphasis === 'strong' ? 1.25 : undefined,
        },
        '&::before': {
          content: '""',
          width: 7,
          height: 7,
          borderRadius: '50%',
          backgroundColor: styles.color,
          ml: 1,
          display: 'inline-block',
        },
      }}
    />
  );
}
