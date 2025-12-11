import React from "react";
import { Card, CardContent } from "@/components/ui/card";

type Props = {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode | any;
  footer?: React.ReactNode;
  cardheading?: string | React.ReactNode;
  headtitle?: string | React.ReactNode;
  headsubtitle?: string | React.ReactNode;
  children?: React.ReactNode;
  middlecontent?: string | React.ReactNode;
};

const DashboardCard = ({
  title,
  subtitle,
  children,
  action,
  footer,
  cardheading,
  headtitle,
  headsubtitle,
  middlecontent,
}: Props) => {
  return (
    <Card className="p-0 shadow-sm border rounded-xl">
      {cardheading ? (
        <CardContent className="p-5">
          <h2 className="text-xl font-semibold">{headtitle}</h2>
          <p className="text-sm text-muted-foreground">{headsubtitle}</p>
        </CardContent>
      ) : (
        <CardContent className="p-8">
          {title && (
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold">{title}</h2>

                {subtitle && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {subtitle}
                  </p>
                )}
              </div>

              {action}
            </div>
          )}

          {children}
        </CardContent>
      )}

      {middlecontent}
      {footer}
    </Card>
  );
};

export default DashboardCard;
