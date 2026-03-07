import { useState } from "react";
import { useFormContext, FieldValues, Path } from "react-hook-form";

export function useFormSteps<T extends FieldValues>(
  totalSteps: number,
  stepFields: Record<number, Path<T>[]>
) {
  const { trigger } = useFormContext<T>();
  const [currentStep, setCurrentStep] = useState(0);

  const nextStep = async () => {
    const fields = stepFields[currentStep];
    if (!fields || fields.length === 0) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps - 1));
      return;
    }
    const isValid = await trigger(fields);
    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps - 1));
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  return { currentStep, setCurrentStep, nextStep, prevStep };
}
