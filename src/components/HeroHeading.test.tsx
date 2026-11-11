import { render, screen } from "@testing-library/react";
import HeroHeading from "./HeroHeading";

describe("HeroHeading", () => {
    it("renders the heading text", () => {
        render(<HeroHeading />);
        const heading = screen.getByRole("heading", { name: /sunuhotel/i });
        expect(heading).toBeInTheDocument();
    });
});