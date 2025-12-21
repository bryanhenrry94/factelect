"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const products = [
  {
    id: "1",
    name: "Sunil Joshi",
    post: "Web Designer",
    pname: "Elite Admin",
    priority: "Low",
    budget: "3.9",
  },
  {
    id: "2",
    name: "Andrew McDownland",
    post: "Project Manager",
    pname: "Real Homes WP Theme",
    priority: "Medium",
    budget: "24.5",
  },
  {
    id: "3",
    name: "Christopher Jamil",
    post: "Project Manager",
    pname: "MedicalPro WP Theme",
    priority: "High",
    budget: "12.8",
  },
  {
    id: "4",
    name: "Nirav Joshi",
    post: "Frontend Engineer",
    pname: "Hosting Press HTML",
    priority: "Critical",
    budget: "2.4",
  },
];

const priorityStyles: Record<string, string> = {
  Low: "bg-blue-500",
  Medium: "bg-yellow-500",
  High: "bg-red-500",
  Critical: "bg-green-500",
};

const ProductPerformance = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Product Performance</CardTitle>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Id</TableHead>
                <TableHead>Assigned</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead className="text-right">Budget</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.id}</TableCell>

                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold">{product.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {product.post}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="text-muted-foreground">
                    {product.pname}
                  </TableCell>

                  <TableCell>
                    <Badge
                      className={`text-white ${
                        priorityStyles[product.priority]
                      }`}
                    >
                      {product.priority}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-right font-semibold">
                    ${product.budget}k
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductPerformance;
