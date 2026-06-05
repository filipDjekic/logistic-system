import { Card, CardContent, Step, StepLabel, Stepper } from '@mui/material';

type FormProgressProps = {
  steps: string[];
  activeStep: number;
};

export default function FormProgress({ steps, activeStep }: FormProgressProps) {
  return (
    <Card>
      <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
        <Stepper activeStep={activeStep} alternativeLabel sx={{ display: { xs: 'none', sm: 'flex' } }}>
          {steps.map((label) => (
            <Step key={label} completed={steps.indexOf(label) < activeStep}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        <Stepper activeStep={activeStep} orientation="vertical" sx={{ display: { xs: 'flex', sm: 'none' } }}>
          {steps.map((label) => (
            <Step key={label} completed={steps.indexOf(label) < activeStep}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </CardContent>
    </Card>
  );
}
