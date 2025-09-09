import { useLocalSearchParams } from "expo-router/build/hooks";
import React from "react";
import ProductDetails from "../../../components/ProductDetails";
import demoData from "../../../data/demoData.json";

export default function TiffinDetails() {
  const params: any = useLocalSearchParams();
  const id = parseInt(params?.id);
  const data =
    demoData.tiffinServices.find((item) => item.id === id) ||
    demoData.tiffinServices[0];

  return <ProductDetails data={data} type="tiffin" />;
}
