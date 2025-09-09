import { useLocalSearchParams } from "expo-router/build/hooks";
import React from "react";
import ProductDetails from "../../../components/ProductDetails";
import demoData from "../../../data/demoData.json";

export default function HostelDetails() {
  const params: any = useLocalSearchParams();
  const id = parseInt(params?.id);

  // Find the hostel data by id
  const data =
    demoData.hostels.find((item) => item.id === id) || demoData.hostels[0];

  return <ProductDetails data={data} type="hostel" />;
}
