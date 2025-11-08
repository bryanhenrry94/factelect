import { Box, Fade, Typography } from "@mui/material";
import { Controller } from "react-hook-form";

type StepProps = {
  control: any;
  errors: any;
};

export const TermsStep: React.FC<StepProps> = ({ control, errors }) => {
  return (
    <Fade in>
      <Box sx={{ mt: 4 }}>
        <Typography variant="subtitle1" textAlign={"center"}>
          (1/3)
        </Typography>
        <Typography variant="h5" textAlign="center" fontWeight={600}>
          Términos y Condiciones
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          textAlign="center"
          mb={3}
        >
          Acepta nuestros términos para completar tu registro.
        </Typography>

        <Box
          sx={{
            p: 2,
            bgcolor: "grey.50",
            borderRadius: 1,
            mb: 3,
            width: "100%",
          }}
        >
          <Typography variant="body2" paragraph>
            Al registrarte en Factelect, aceptas nuestros términos de servicio y
            política de privacidad. Tu información será tratada con la máxima
            confidencialidad y utilizada únicamente para la prestación de
            nuestros servicios de facturación electrónica.
          </Typography>
          <Typography variant="body2">
            Para más detalles, puedes revisar nuestros{" "}
            <Typography
              component="a"
              href="/terms"
              color="primary"
              sx={{ textDecoration: "none" }}
            >
              términos completos
            </Typography>{" "}
            y{" "}
            <Typography
              component="a"
              href="/privacy"
              color="primary"
              sx={{ textDecoration: "none" }}
            >
              política de privacidad
            </Typography>
            .
          </Typography>

          <Controller
            name="acceptTerms"
            control={control}
            rules={{ required: "Debes aceptar los términos y condiciones" }}
            render={({ field }) => (
              <Box sx={{ mt: 2 }}>
                <Box display="flex" alignItems="center" gap={1}>
                  <input
                    type="checkbox"
                    id="acceptTerms"
                    checked={field.value || false}
                    onChange={(e) => field.onChange(e.target.checked)}
                  />
                  <Typography
                    component="label"
                    htmlFor="acceptTerms"
                    variant="body2"
                    sx={{ cursor: "pointer" }}
                  >
                    Acepto los términos y condiciones de uso
                  </Typography>
                </Box>
                {errors.acceptTerms && (
                  <Typography
                    variant="caption"
                    color="error"
                    sx={{ mt: 1, display: "block" }}
                  >
                    {errors.acceptTerms?.message}
                  </Typography>
                )}
              </Box>
            )}
          />
        </Box>
      </Box>
    </Fade>
  );
};
