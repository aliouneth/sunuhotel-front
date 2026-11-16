import { act, renderHook } from "@testing-library/react";
import { useSpamGuard } from "./anti-spam";

describe("useSpamGuard", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-11-15T10:00:00Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("blocks a submission sent too quickly", () => {
    const { result } = renderHook(() => useSpamGuard(3));

    expect(result.current.isSpam()).toBe(true);

    act(() => {
      jest.advanceTimersByTime(2999);
    });
    expect(result.current.isSpam()).toBe(true);

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(result.current.isSpam()).toBe(false);
  });

  it("blocks when the honeypot is filled", () => {
    const { result } = renderHook(() => useSpamGuard(0));

    act(() => {
      result.current.setHoneypot("https://spam.example");
    });

    expect(result.current.isSpam()).toBe(true);

    act(() => {
      result.current.setHoneypot("   ");
    });
    expect(result.current.isSpam()).toBe(false);
  });
});
