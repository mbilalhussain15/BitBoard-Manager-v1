import { CirclePlus, LayoutGrid } from "lucide-react";
import { Button } from "../components/form/Button";

export const NoDataFound = ({
  title,
  description,
  buttonText,
  buttonAction,
}) => {
  return (
    <div className="col-span-full text-center py-12 2xl:py-24 bg-muted/40 rounded-lg">
      <LayoutGrid className="size-12 mx-auto text-muted-foreground" />
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>

      <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
        {description}
      </p>
      <Button onClick={buttonAction} className="mt-4 inline-flex !w-auto shrink-0 items-center gap-2 px-4 py-2 whitespace-nowrap cursor-pointer">
        <CirclePlus className="mr-2" />
        {buttonText}
      </Button>
    </div>
  );
};