"use client";

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Star, Baseline } from "lucide-react";

const ecoCard = [
  {
    title: "Boat Headphone",
    subheader: "September 14, 2023",
    photo: "/images/products/s4.jpg",
    salesPrice: 375,
    price: 285,
    rating: 4,
  },
  {
    title: "MacBook Air Pro",
    subheader: "September 14, 2023",
    photo: "/images/products/s5.jpg",
    salesPrice: 650,
    price: 900,
    rating: 5,
  },
  {
    title: "Red Valvet Dress",
    subheader: "September 14, 2023",
    photo: "/images/products/s7.jpg",
    salesPrice: 150,
    price: 200,
    rating: 3,
  },
  {
    title: "Cute Soft Teddybear",
    subheader: "September 14, 2023",
    photo: "/images/products/s11.jpg",
    salesPrice: 285,
    price: 345,
    rating: 2,
  },
];

const RatingStars = ({ value }: { value: number }) => (
  <div className="flex gap-0.5">
    {Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < value
            ? "fill-yellow-400 text-yellow-400"
            : "text-muted-foreground"
        }`}
      />
    ))}
  </div>
);

const Blog = () => {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {ecoCard.map((product, index) => (
        <Card key={index} className="relative overflow-hidden">
          {/* Imagen */}
          <Link href="/" className="block">
            <div className="relative h-[250px] w-full">
              <Image
                src={product.photo}
                alt={product.title}
                fill
                className="object-cover"
              />
            </div>
          </Link>

          {/* Botón flotante */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                className="absolute right-4 top-[210px] rounded-full"
              >
                <Baseline className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add To Cart</TooltipContent>
          </Tooltip>

          {/* Contenido */}
          <CardContent className="space-y-2 pt-3">
            <h3 className="text-base font-semibold">{product.title}</h3>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold">${product.price}</span>
                <span className="text-sm text-muted-foreground line-through">
                  ${product.salesPrice}
                </span>
              </div>

              <RatingStars value={product.rating} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default Blog;
