"use client";

import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Home() {
  const router = useRouter();

  const handleValueChange = (value: string) => {
    switch (value) {
      case "option1":
        router.push("/namelist");
        break;
      case "option2":
        router.push("/pnrdetails");
        break;
      case "option3":
        router.push("/flightops");
        break;
      default:
        break;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full grow mt-20">
      <Card className="w-100 shadow-xl bg-white/95 backdrop-blur z-10 relative">
        <CardHeader>
          <CardTitle className="text-xl text-gray-800">Welcome</CardTitle>
          <CardDescription className="text-gray-500 font-medium">
            What are you here for?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select onValueChange={handleValueChange}>
            <SelectTrigger className="w-full bg-white">
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>

            {/* FIX: Added position="popper" and sideOffset to stop overlapping */}
            <SelectContent
              position="popper"
              sideOffset={5}
              className="z-50 bg-white"
            >
              <SelectItem value="option1">Namelist Formatting !</SelectItem>
              <SelectItem value="option2">PNR Purchase Data !</SelectItem>
              <SelectItem value="option3">
                Flight Operations "GOOD/BAD" !
              </SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
    </div>
  );
}
