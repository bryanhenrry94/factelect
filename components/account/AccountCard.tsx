import { Account } from "@/lib/validations";
import { getAccountTypeLabel } from "@/utils/account";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  useTheme,
  IconButton,
} from "@mui/material";
import { Edit, Wallet } from "lucide-react";

interface AccountCardProps {
  account: Account;
  onSelected?: (account: Account) => void;
  onEdit?: (account: Account) => void;
}

export const AccountCard: React.FC<AccountCardProps> = ({
  account,
  onSelected,
  onEdit,
}) => {
  const theme = useTheme();

  return (
    <Card
      variant="outlined"
      onClick={() => onSelected && onSelected(account)}
      sx={{
        mb: 2,
        borderRadius: 3,
        cursor: "pointer",
        backgroundColor: theme.palette.background.paper,
        borderColor: theme.palette.divider,
        transition: "all 0.25s ease",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        "&:hover": {
          transform: "translateY(-3px)",
          boxShadow: "0 6px 14px rgba(0,0,0,0.12)",
          borderColor: theme.palette.primary.main,
        },
      }}
    >
      <CardContent sx={{ p: 2, pb: 2.5 }}>
        {/* Header */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="flex-start"
        >
          <Box display="flex" gap={1.5} alignItems="center">
            {/* Icon inside circular badge */}
            <Box
              sx={{
                p: 1,
                borderRadius: "50%",
                backgroundColor: theme.palette.primary.light,
                color: theme.palette.primary.main,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Wallet size={18} />
            </Box>

            {/* Account Name + Number */}
            <Box>
              <Typography variant="subtitle1" fontWeight={600} lineHeight={1.1}>
                {account.name}
              </Typography>

              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 0.4, display: "block" }}
              >
                {account.number || account.last4}
              </Typography>
            </Box>
          </Box>

          {/* Edit button */}
          {onEdit && (
            <IconButton
              aria-label="Editar"
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(account);
              }}
              sx={{
                color: theme.palette.text.secondary,
                "&:hover": {
                  color: theme.palette.primary.main,
                },
              }}
            >
              <Edit size={18} />
            </IconButton>
          )}
        </Box>

        {/* Footer / Balance */}
        <Box
          sx={{
            mt: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
          }}
        >
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
            <Chip
              label={getAccountTypeLabel(account.type)}
              size="small"
              sx={{
                alignSelf: "flex-start",
                bgcolor: theme.palette.grey[100],
                color: theme.palette.text.primary,
                borderRadius: 1.5,
                fontWeight: 500,
                fontSize: "0.75rem",
              }}
            />

            <Typography
              variant="h5"
              fontWeight={700}
              sx={{
                color: theme.palette.primary.main,
                lineHeight: 1.2,
              }}
            >
              {account.currency} {account.balance.toFixed(2)}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};
