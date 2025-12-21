"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const transactions = [
  {
    time: "09:30 am",
    text: "Payment received from John Doe of $385.90",
    color: "border-blue-500",
  },
  {
    time: "10:00 am",
    title: "New sale recorded",
    link: "#ML-3467",
    color: "border-purple-500",
  },
  {
    time: "12:00 am",
    text: "Payment was made of $64.95 to Michael",
    color: "border-green-500",
  },
  {
    time: "09:30 am",
    title: "New sale recorded",
    link: "#ML-3467",
    color: "border-yellow-500",
  },
  {
    time: "09:30 am",
    title: "New arrival recorded",
    color: "border-red-500",
  },
  {
    time: "12:00 am",
    text: "Payment Received",
    color: "border-green-500",
    last: true,
  },
];

const RecentTransactions = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
      </CardHeader>

      <CardContent>
        <div className="relative space-y-6">
          {transactions.map((item, index) => (
            <div key={index} className="flex items-start gap-4">
              {/* Hora */}
              <div className="w-20 text-sm text-muted-foreground">
                {item.time}
              </div>

              {/* Línea + punto */}
              <div className="relative flex flex-col items-center">
                <div
                  className={cn(
                    "h-3 w-3 rounded-full border-2 bg-background",
                    item.color
                  )}
                />
                {!item.last && <div className="mt-1 h-full w-px bg-border" />}
              </div>

              {/* Contenido */}
              <div className="flex-1 text-sm">
                {item.title && (
                  <div className="font-semibold">{item.title}</div>
                )}
                {item.text && <div>{item.text}</div>}
                {item.link && (
                  <Link
                    href="/"
                    className="text-primary hover:underline text-sm"
                  >
                    {item.link}
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentTransactions;
