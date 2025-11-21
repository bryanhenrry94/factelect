import { Users } from "lucide-react";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

interface FilterCardProps {
  title: string;
  count: number;
  icon?: React.ElementType;
  color?: "blue" | "sky" | "green" | "yellow";
  onClick?: () => void;
}

const colorMap = {
  blue: {
    card: "#e3f2fd",
    icon: "#2196f3",
    text: "#1a237e",
  },
  sky: {
    card: "#e0f7fa",
    icon: "#00bcd4",
    text: "#006064",
  },
  green: {
    card: "#e8f5e9",
    icon: "#43a047",
    text: "#1b5e20",
  },
  yellow: {
    card: "#fffde7",
    icon: "#fbc02d",
    text: "#f57f17",
  },
};

export default function FilterCard({
  title,
  count,
  icon: Icon = Users,
  color = "blue",
  onClick,
}: FilterCardProps) {
  const colors = colorMap[color];
  return (
    <Card
      sx={{
        minWidth: 180,
        backgroundColor: colors.card,
        boxShadow: 0,
      }}
    >
      <CardActionArea
        onClick={onClick}
        sx={{ display: "flex", alignItems: "center", gap: 1, p: 1.5 }}
      >
        <Box
          sx={{
            minWidth: 50,
            minHeight: 50,
            backgroundColor: colors.icon,
            color: "#fff",
            borderRadius: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mr: 2,
          }}
        >
          <Icon size={22} />
        </Box>
        <CardContent sx={{ p: 0 }}>
          <Typography variant="subtitle1" fontWeight={500} color={colors.text}>
            {title}
          </Typography>
          <Typography variant="h5" fontWeight={600}>
            {count} Personas
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
