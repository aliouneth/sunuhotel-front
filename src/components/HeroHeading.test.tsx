import { render, screen } from "@testing-library/react";
import { HeroHeading } from "./HeroHeading";

jest.mock("@/i18n/LocaleProvider", () => ({
  useLocale: () => ({
    locale: "fr",
    setLocale: jest.fn(),
    t: (key: string) =>
      key === "hotel_finder_title"
        ? "Trouvez un hôtel et faites vos réservations"
        : "Sous-titre",
  }),
}));

describe("HeroHeading", () => {
  it("renders the translated heading", () => {
    render(<HeroHeading />);
    expect(screen.getByRole("heading", { name: /hôtel/i })).toBeInTheDocument();
  });
});
