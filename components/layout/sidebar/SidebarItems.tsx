import { Box } from "@mui/material";
import {
  Sidebar as MUI_Sidebar,
  Menu,
  MenuItem,
  Submenu,
} from "react-mui-sidebar";
import { Dot } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Menuitems from "./MenuItems";
import Logo from "../shared/logo/Logo";

const renderMenuItems = (items: any, pathDirect: any, isChild = false) => {
  return items.map((item: any) => {
    const Icon = item.icon ? item.icon : Dot;

    const itemIcon = (
      <Icon
        {...(Icon === Dot
          ? { stroke: 1.5, size: "1.3rem" }
          : { size: "1.3rem" })}
      />
    );

    // Subheader
    if (item.subheader) {
      return (
        <Menu subHeading={item.subheader} key={item.subheader}>
          {null}
        </Menu>
      );
    }

    // Submenu (tiene hijos)
    if (item.children) {
      return (
        <Submenu
          key={item.id}
          title={item.title}
          icon={itemIcon}
          borderRadius="7px"
        >
          {renderMenuItems(item.children, pathDirect, true)}
        </Submenu>
      );
    }

    // MenuItem sin hijos
    return (
      <Box
        key={item.id}
        sx={{
          px: isChild ? 1 : 0, // ⭐ solo agrega padding si está dentro de un submenu
        }}
      >
        <MenuItem
          key={item.id}
          isSelected={pathDirect === item?.href}
          borderRadius="8px"
          icon={itemIcon}
          link={item.href}
          component={Link}
        >
          {item.title}
        </MenuItem>
      </Box>
    );
  });
};

const SidebarItems = () => {
  const pathname = usePathname();
  const pathDirect = pathname;

  return (
    <>
      <MUI_Sidebar
        width={"100%"}
        showProfile={false}
        themeColor={"#5D87FF"}
        themeSecondaryColor={"#49beff"}
      >
        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <Logo />
        </Box>

        {renderMenuItems(Menuitems, pathDirect)}
      </MUI_Sidebar>
    </>
  );
};

export default SidebarItems;
