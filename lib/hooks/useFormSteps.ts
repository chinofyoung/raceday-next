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
    } else {
      // Focus the first field with an error
      requestAnimationFrame(() => {
        const firstError = document.querySelector<HTMLElement>('[aria-invalid="true"], .border-red-500\\/50');
        if (firstError) {
          firstError.scrollIntoView({ behavior: "smooth", block: "center" });
          firstError.focus();
        }
      });
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  return { currentStep, setCurrentStep, nextStep, prevStep };
}
