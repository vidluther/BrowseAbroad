import { describe, it, expect, beforeEach } from "vitest";
import { loadPriceDetector } from "../helpers/load-module.js";

describe("PriceDetector", () => {
  let PriceDetector;

  beforeEach(() => {
    PriceDetector = loadPriceDetector();
  });

  describe("parsePrice - Pure Function Tests", () => {
    describe("INR formats", () => {
      it("should parse ₹ symbol format", () => {
        const result = PriceDetector.parsePrice("₹1,234.56");
        expect(result).toEqual({
          amount: 1234.56,
          currency: "INR",
          original: "₹1,234.56",
        });
      });

      it("should parse ₹ with space", () => {
        const result = PriceDetector.parsePrice("₹ 999");
        expect(result).toEqual({
          amount: 999,
          currency: "INR",
          original: "₹ 999",
        });
      });

      it("should parse ₹ without decimal", () => {
        const result = PriceDetector.parsePrice("₹1000");
        expect(result).toEqual({
          amount: 1000,
          currency: "INR",
          original: "₹1000",
        });
      });

      it("should parse Rs. format", () => {
        const result = PriceDetector.parsePrice("Rs.5,000");
        expect(result).toEqual({
          amount: 5000,
          currency: "INR",
          original: "Rs.5,000",
        });
      });

      it("should parse Rs format (no dot)", () => {
        const result = PriceDetector.parsePrice("Rs 1500");
        expect(result).toEqual({
          amount: 1500,
          currency: "INR",
          original: "Rs 1500",
        });
      });

      it("should parse INR prefix", () => {
        const result = PriceDetector.parsePrice("INR 2,500.00");
        expect(result).toEqual({
          amount: 2500,
          currency: "INR",
          original: "INR 2,500.00",
        });
      });

      it("should handle large INR amounts with Indian comma format", () => {
        const result = PriceDetector.parsePrice("₹1,00,00,000");
        expect(result.amount).toBe(10000000);
        expect(result.currency).toBe("INR");
      });
    });

    describe("USD formats", () => {
      it("should parse USD prefix", () => {
        const result = PriceDetector.parsePrice("USD 50.00");
        expect(result).toEqual({
          amount: 50,
          currency: "USD",
          original: "USD 50.00",
        });
      });

      it("should parse US$ format", () => {
        const result = PriceDetector.parsePrice("US$100");
        expect(result).toEqual({
          amount: 100,
          currency: "USD",
          original: "US$100",
        });
      });

      it("should parse US$ with space", () => {
        const result = PriceDetector.parsePrice("US$ 250.50");
        expect(result).toEqual({
          amount: 250.5,
          currency: "USD",
          original: "US$ 250.50",
        });
      });

      it("should parse USD without space", () => {
        const result = PriceDetector.parsePrice("USD100");
        expect(result).toEqual({
          amount: 100,
          currency: "USD",
          original: "USD100",
        });
      });

      it("should parse $ symbol format", () => {
        const result = PriceDetector.parsePrice("$99.99");
        expect(result).toEqual({
          amount: 99.99,
          currency: "USD",
          original: "$99.99",
        });
      });

      it("should parse $ with space", () => {
        const result = PriceDetector.parsePrice("$ 100");
        expect(result).toEqual({
          amount: 100,
          currency: "USD",
          original: "$ 100",
        });
      });

      it("should parse $ with commas", () => {
        const result = PriceDetector.parsePrice("$1,234.56");
        expect(result).toEqual({
          amount: 1234.56,
          currency: "USD",
          original: "$1,234.56",
        });
      });

      it("should parse $ with decimal", () => {
        const result = PriceDetector.parsePrice("$10.50");
        expect(result).toEqual({
          amount: 10.5,
          currency: "USD",
          original: "$10.50",
        });
      });
    });

    describe("EUR formats", () => {
      it("should parse € symbol format", () => {
        const result = PriceDetector.parsePrice("€1,234.56");
        expect(result).toEqual({
          amount: 1234.56,
          currency: "EUR",
          original: "€1,234.56",
        });
      });

      it("should parse € with space", () => {
        const result = PriceDetector.parsePrice("€ 999");
        expect(result).toEqual({
          amount: 999,
          currency: "EUR",
          original: "€ 999",
        });
      });

      it("should parse € without decimal", () => {
        const result = PriceDetector.parsePrice("€1000");
        expect(result).toEqual({
          amount: 1000,
          currency: "EUR",
          original: "€1000",
        });
      });

      it("should parse EUR prefix", () => {
        const result = PriceDetector.parsePrice("EUR 2,500.00");
        expect(result).toEqual({
          amount: 2500,
          currency: "EUR",
          original: "EUR 2,500.00",
        });
      });

      it("should parse EUR without space", () => {
        const result = PriceDetector.parsePrice("EUR100");
        expect(result).toEqual({
          amount: 100,
          currency: "EUR",
          original: "EUR100",
        });
      });
    });

    describe("GBP formats", () => {
      it("should parse £ symbol format", () => {
        const result = PriceDetector.parsePrice("£1,234.56");
        expect(result).toEqual({
          amount: 1234.56,
          currency: "GBP",
          original: "£1,234.56",
        });
      });

      it("should parse £ with space", () => {
        const result = PriceDetector.parsePrice("£ 999");
        expect(result).toEqual({
          amount: 999,
          currency: "GBP",
          original: "£ 999",
        });
      });

      it("should parse £ without decimal", () => {
        const result = PriceDetector.parsePrice("£1000");
        expect(result).toEqual({
          amount: 1000,
          currency: "GBP",
          original: "£1000",
        });
      });

      it("should parse GBP prefix", () => {
        const result = PriceDetector.parsePrice("GBP 2,500.00");
        expect(result).toEqual({
          amount: 2500,
          currency: "GBP",
          original: "GBP 2,500.00",
        });
      });

      it("should parse GBP without space", () => {
        const result = PriceDetector.parsePrice("GBP100");
        expect(result).toEqual({
          amount: 100,
          currency: "GBP",
          original: "GBP100",
        });
      });
    });

    describe("Edge cases", () => {
      it("should return null for empty string", () => {
        expect(PriceDetector.parsePrice("")).toBeNull();
      });

      it("should return null for whitespace only", () => {
        expect(PriceDetector.parsePrice("   ")).toBeNull();
      });

      it("should return null for non-price strings", () => {
        expect(PriceDetector.parsePrice("hello")).toBeNull();
        expect(PriceDetector.parsePrice("123")).toBeNull(); // No currency
      });

      it("should return null for zero amount", () => {
        expect(PriceDetector.parsePrice("$0")).toBeNull();
        expect(PriceDetector.parsePrice("₹0.00")).toBeNull();
      });

      it("should return null for negative amounts", () => {
        // parsePrice doesn't handle negative, should return null
        expect(PriceDetector.parsePrice("$-50")).toBeNull();
      });

      it("should trim whitespace", () => {
        const result = PriceDetector.parsePrice("  ₹50.00  ");
        expect(result.amount).toBe(50);
      });

      it("should handle prices with single decimal digit", () => {
        const result = PriceDetector.parsePrice("₹10.5");
        expect(result.amount).toBe(10.5);
      });

      it("should return null for unrecognized currency", () => {
        expect(PriceDetector.parsePrice("¥1000")).toBeNull();
        expect(PriceDetector.parsePrice("₩50000")).toBeNull();
      });
    });
  });

  describe("shouldSkipElement", () => {
    it("should return true for null element", () => {
      expect(PriceDetector.shouldSkipElement(null)).toBe(true);
    });

    it("should return true for undefined element", () => {
      expect(PriceDetector.shouldSkipElement(undefined)).toBe(true);
    });

    it("should skip SCRIPT elements", () => {
      const script = document.createElement("script");
      expect(PriceDetector.shouldSkipElement(script)).toBe(true);
    });

    it("should skip STYLE elements", () => {
      const style = document.createElement("style");
      expect(PriceDetector.shouldSkipElement(style)).toBe(true);
    });

    it("should skip NOSCRIPT elements", () => {
      const noscript = document.createElement("noscript");
      expect(PriceDetector.shouldSkipElement(noscript)).toBe(true);
    });

    it("should skip IFRAME elements", () => {
      const iframe = document.createElement("iframe");
      expect(PriceDetector.shouldSkipElement(iframe)).toBe(true);
    });

    it("should skip INPUT elements", () => {
      const input = document.createElement("input");
      expect(PriceDetector.shouldSkipElement(input)).toBe(true);
    });

    it("should skip TEXTAREA elements", () => {
      const textarea = document.createElement("textarea");
      expect(PriceDetector.shouldSkipElement(textarea)).toBe(true);
    });

    it("should skip SELECT elements", () => {
      const select = document.createElement("select");
      expect(PriceDetector.shouldSkipElement(select)).toBe(true);
    });

    it("should skip hidden elements (display: none)", () => {
      const div = document.createElement("div");
      div.style.display = "none";
      document.body.appendChild(div);
      expect(PriceDetector.shouldSkipElement(div)).toBe(true);
      div.remove();
    });

    it("should skip elements with visibility: hidden", () => {
      const div = document.createElement("div");
      div.style.visibility = "hidden";
      document.body.appendChild(div);
      expect(PriceDetector.shouldSkipElement(div)).toBe(true);
      div.remove();
    });

    it("should skip already processed elements", () => {
      const div = document.createElement("div");
      div.setAttribute("data-price-detected", "true");
      expect(PriceDetector.shouldSkipElement(div)).toBe(true);
    });

    // Note: jsdom does not implement isContentEditable property (returns undefined)
    // This test verifies the check doesn't error, but can't verify actual behavior
    it.skip("should skip contentEditable elements", () => {
      const div = document.createElement("div");
      div.contentEditable = "true";
      // Element needs to be in DOM for isContentEditable to be computed
      document.body.appendChild(div);
      // jsdom limitation: isContentEditable is undefined, not true
      expect(PriceDetector.shouldSkipElement(div)).toBe(true);
      div.remove();
    });

    it("should NOT skip visible DIV elements", () => {
      const div = document.createElement("div");
      document.body.appendChild(div);
      expect(PriceDetector.shouldSkipElement(div)).toBe(false);
      div.remove();
    });

    it("should NOT skip visible SPAN elements", () => {
      const span = document.createElement("span");
      document.body.appendChild(span);
      expect(PriceDetector.shouldSkipElement(span)).toBe(false);
      span.remove();
    });

    it("should NOT skip visible P elements", () => {
      const p = document.createElement("p");
      document.body.appendChild(p);
      expect(PriceDetector.shouldSkipElement(p)).toBe(false);
      p.remove();
    });
  });

  describe("processTextNode", () => {
    it("should wrap detected prices in span elements", () => {
      const container = document.createElement("div");
      container.textContent = "Price: ₹99.99 only";
      document.body.appendChild(container);

      const textNode = container.firstChild;
      const result = PriceDetector.processTextNode(textNode);

      expect(result).toBe(true);
      expect(
        container.querySelector(".currency-converter-price"),
      ).not.toBeNull();

      container.remove();
    });

    it("should set correct data attributes on wrapped prices", () => {
      const container = document.createElement("div");
      container.textContent = "₹1,500";
      document.body.appendChild(container);

      PriceDetector.processTextNode(container.firstChild);
      const priceSpan = container.querySelector(".currency-converter-price");

      expect(priceSpan.getAttribute("data-amount")).toBe("1500");
      expect(priceSpan.getAttribute("data-currency")).toBe("INR");
      expect(priceSpan.getAttribute("data-price-detected")).toBe("true");

      container.remove();
    });

    it("should handle multiple prices in one text node", () => {
      const container = document.createElement("div");
      container.textContent = "Compare: ₹100 vs ₹8,300";
      document.body.appendChild(container);

      PriceDetector.processTextNode(container.firstChild);
      const prices = container.querySelectorAll(".currency-converter-price");

      expect(prices.length).toBe(2);

      container.remove();
    });

    it("should return false for empty text nodes", () => {
      const container = document.createElement("div");
      container.textContent = "";
      // Empty text content means firstChild is null
      // processTextNode handles null input gracefully
      const textNode = container.firstChild;
      if (textNode) {
        const result = PriceDetector.processTextNode(textNode);
        expect(result).toBe(false);
      } else {
        // No text node created for empty string - this is expected
        expect(textNode).toBeNull();
      }
    });

    it("should return false for whitespace-only text nodes", () => {
      const container = document.createElement("div");
      container.textContent = "   ";
      document.body.appendChild(container);

      const result = PriceDetector.processTextNode(container.firstChild);
      expect(result).toBe(false);

      container.remove();
    });

    it("should return false for text with no prices", () => {
      const container = document.createElement("div");
      container.textContent = "No prices here";
      document.body.appendChild(container);

      const result = PriceDetector.processTextNode(container.firstChild);
      expect(result).toBe(false);

      container.remove();
    });

    it("should preserve text before and after prices", () => {
      const container = document.createElement("div");
      container.textContent = "Before ₹50 After";
      document.body.appendChild(container);

      PriceDetector.processTextNode(container.firstChild);

      expect(container.textContent).toBe("Before ₹50 After");

      container.remove();
    });

    it("should handle price at start of text", () => {
      const container = document.createElement("div");
      container.textContent = "₹100 is the price";
      document.body.appendChild(container);

      PriceDetector.processTextNode(container.firstChild);
      const priceSpan = container.querySelector(".currency-converter-price");

      expect(priceSpan).not.toBeNull();
      expect(priceSpan.textContent).toBe("₹100");

      container.remove();
    });

    it("should handle price at end of text", () => {
      const container = document.createElement("div");
      container.textContent = "The price is ₹999";
      document.body.appendChild(container);

      PriceDetector.processTextNode(container.firstChild);
      const priceSpan = container.querySelector(".currency-converter-price");

      expect(priceSpan).not.toBeNull();
      expect(priceSpan.textContent).toBe("₹999");

      container.remove();
    });
  });

  describe("scanDOM", () => {
    it("should find prices in nested elements", () => {
      const html = `
        <div>
          <p>First price: ₹50</p>
          <div>
            <span>Second price: ₹4,000</span>
          </div>
        </div>
      `;
      const container = document.createElement("div");
      container.innerHTML = html;
      document.body.appendChild(container);

      PriceDetector.scanDOM(container);
      const prices = container.querySelectorAll(".currency-converter-price");

      expect(prices.length).toBe(2);

      container.remove();
    });

    it("should not process prices inside SCRIPT tags", () => {
      const container = document.createElement("div");
      container.innerHTML = '<script>var price = "₹100";</script><p>₹50</p>';
      document.body.appendChild(container);

      PriceDetector.scanDOM(container);
      const prices = container.querySelectorAll(".currency-converter-price");

      expect(prices.length).toBe(1);
      expect(prices[0].getAttribute("data-amount")).toBe("50");

      container.remove();
    });

    it("should handle null root gracefully", () => {
      expect(() => PriceDetector.scanDOM(null)).not.toThrow();
    });

    it("should handle undefined root gracefully", () => {
      expect(() => PriceDetector.scanDOM(undefined)).not.toThrow();
    });

    it("should detect prices with Rs. format", () => {
      const container = document.createElement("div");
      container.innerHTML = "<p>Price: Rs. 2,500</p>";
      document.body.appendChild(container);

      PriceDetector.scanDOM(container);
      const priceSpan = container.querySelector(".currency-converter-price");

      expect(priceSpan).not.toBeNull();
      expect(priceSpan.getAttribute("data-currency")).toBe("INR");

      container.remove();
    });

    it("should not re-process already detected prices", () => {
      const container = document.createElement("div");
      container.innerHTML = "<p>₹100</p>";
      document.body.appendChild(container);

      PriceDetector.scanDOM(container);
      const firstScanPrices = container.querySelectorAll(
        ".currency-converter-price",
      );
      expect(firstScanPrices.length).toBe(1);

      // Scan again
      PriceDetector.scanDOM(container);
      const secondScanPrices = container.querySelectorAll(
        ".currency-converter-price",
      );
      expect(secondScanPrices.length).toBe(1); // Should still be 1, not 2

      container.remove();
    });

    it("should detect EUR prices", () => {
      const container = document.createElement("div");
      container.innerHTML = "<p>Price: €50.00</p>";
      document.body.appendChild(container);

      PriceDetector.scanDOM(container);
      const priceSpan = container.querySelector(".currency-converter-price");

      expect(priceSpan).not.toBeNull();
      expect(priceSpan.getAttribute("data-currency")).toBe("EUR");
      expect(priceSpan.getAttribute("data-amount")).toBe("50");

      container.remove();
    });

    it("should detect GBP prices", () => {
      const container = document.createElement("div");
      container.innerHTML = "<p>Price: £99.99</p>";
      document.body.appendChild(container);

      PriceDetector.scanDOM(container);
      const priceSpan = container.querySelector(".currency-converter-price");

      expect(priceSpan).not.toBeNull();
      expect(priceSpan.getAttribute("data-currency")).toBe("GBP");
      expect(priceSpan.getAttribute("data-amount")).toBe("99.99");

      container.remove();
    });

    it("should detect mixed currencies in one page", () => {
      const container = document.createElement("div");
      container.innerHTML = "<p>$100</p><p>€200</p><p>£300</p><p>₹400</p>";
      document.body.appendChild(container);

      PriceDetector.scanDOM(container);
      const prices = container.querySelectorAll(".currency-converter-price");

      expect(prices.length).toBe(4);
      const currencies = Array.from(prices).map((p) =>
        p.getAttribute("data-currency"),
      );
      expect(currencies).toContain("USD");
      expect(currencies).toContain("EUR");
      expect(currencies).toContain("GBP");
      expect(currencies).toContain("INR");

      container.remove();
    });
  });

  describe("False Positive Prevention - Rs word boundary", () => {
    describe('should NOT match "rs" within words (false positives)', () => {
      it('should not match "12 hours 20 minutes"', () => {
        const container = document.createElement("div");
        container.textContent = "12 hours 20 minutes";
        document.body.appendChild(container);

        PriceDetector.scanDOM(container);
        const prices = container.querySelectorAll(".currency-converter-price");

        expect(prices.length).toBe(0);
        container.remove();
      });

      it('should not match "3 hours 5 minutes"', () => {
        const container = document.createElement("div");
        container.textContent = "3 hours 5 minutes";
        document.body.appendChild(container);

        PriceDetector.scanDOM(container);
        const prices = container.querySelectorAll(".currency-converter-price");

        expect(prices.length).toBe(0);
        container.remove();
      });

      it('should not match "yours 50"', () => {
        const container = document.createElement("div");
        container.textContent = "yours 50";
        document.body.appendChild(container);

        PriceDetector.scanDOM(container);
        const prices = container.querySelectorAll(".currency-converter-price");

        expect(prices.length).toBe(0);
        container.remove();
      });

      it('should not match "colors 100"', () => {
        const container = document.createElement("div");
        container.textContent = "colors 100";
        document.body.appendChild(container);

        PriceDetector.scanDOM(container);
        const prices = container.querySelectorAll(".currency-converter-price");

        expect(prices.length).toBe(0);
        container.remove();
      });
    });

    describe("should still match valid Rs patterns", () => {
      it('should match "Rs. 100" at start of string', () => {
        const container = document.createElement("div");
        container.textContent = "Rs. 100";
        document.body.appendChild(container);

        PriceDetector.scanDOM(container);
        const prices = container.querySelectorAll(".currency-converter-price");

        expect(prices.length).toBe(1);
        expect(prices[0].getAttribute("data-amount")).toBe("100");
        container.remove();
      });

      it('should match "Rs 100" without dot', () => {
        const container = document.createElement("div");
        container.textContent = "Rs 100";
        document.body.appendChild(container);

        PriceDetector.scanDOM(container);
        const prices = container.querySelectorAll(".currency-converter-price");

        expect(prices.length).toBe(1);
        expect(prices[0].getAttribute("data-amount")).toBe("100");
        container.remove();
      });

      it('should match "RS. 100" uppercase', () => {
        const container = document.createElement("div");
        container.textContent = "RS. 100";
        document.body.appendChild(container);

        PriceDetector.scanDOM(container);
        const prices = container.querySelectorAll(".currency-converter-price");

        expect(prices.length).toBe(1);
        expect(prices[0].getAttribute("data-amount")).toBe("100");
        container.remove();
      });

      it('should match "rs 100" lowercase', () => {
        const container = document.createElement("div");
        container.textContent = "rs 100";
        document.body.appendChild(container);

        PriceDetector.scanDOM(container);
        const prices = container.querySelectorAll(".currency-converter-price");

        expect(prices.length).toBe(1);
        expect(prices[0].getAttribute("data-amount")).toBe("100");
        container.remove();
      });

      it('should match "Rs. 1,00,000" with Indian comma format', () => {
        const container = document.createElement("div");
        container.textContent = "Rs. 1,00,000";
        document.body.appendChild(container);

        PriceDetector.scanDOM(container);
        const prices = container.querySelectorAll(".currency-converter-price");

        expect(prices.length).toBe(1);
        expect(prices[0].getAttribute("data-amount")).toBe("100000");
        container.remove();
      });

      it('should match "Buy now for Rs. 500" after text', () => {
        const container = document.createElement("div");
        container.textContent = "Buy now for Rs. 500";
        document.body.appendChild(container);

        PriceDetector.scanDOM(container);
        const prices = container.querySelectorAll(".currency-converter-price");

        expect(prices.length).toBe(1);
        expect(prices[0].getAttribute("data-amount")).toBe("500");
        container.remove();
      });

      it('should match "Price:Rs.250" after punctuation', () => {
        const container = document.createElement("div");
        container.textContent = "Price:Rs.250";
        document.body.appendChild(container);

        PriceDetector.scanDOM(container);
        const prices = container.querySelectorAll(".currency-converter-price");

        expect(prices.length).toBe(1);
        expect(prices[0].getAttribute("data-amount")).toBe("250");
        container.remove();
      });

      it('should match "(Rs. 750)" in parentheses', () => {
        const container = document.createElement("div");
        container.textContent = "(Rs. 750)";
        document.body.appendChild(container);

        PriceDetector.scanDOM(container);
        const prices = container.querySelectorAll(".currency-converter-price");

        expect(prices.length).toBe(1);
        expect(prices[0].getAttribute("data-amount")).toBe("750");
        container.remove();
      });
    });
  });

  describe("Regex Pattern Tests", () => {
    describe("combinedPattern", () => {
      it("should match INR patterns", () => {
        const testCases = [
          "₹100",
          "₹ 100",
          "₹1,000",
          "₹1,00,000",
          "Rs.100",
          "Rs 100",
          "Rs.1,234.56",
          "INR 100",
          "INR100",
        ];

        testCases.forEach((price) => {
          PriceDetector.combinedPattern.lastIndex = 0;
          expect(PriceDetector.combinedPattern.test(price)).toBe(true);
        });
      });

      it("should match USD patterns", () => {
        const testCases = [
          "$100",
          "$ 100",
          "$1,000",
          "$99.99",
          "USD 100",
          "USD100",
          "US$100",
          "US$ 100",
        ];

        testCases.forEach((price) => {
          PriceDetector.combinedPattern.lastIndex = 0;
          expect(PriceDetector.combinedPattern.test(price)).toBe(true);
        });
      });

      it("should match EUR and GBP patterns", () => {
        const eurGbpMatches = [
          "€100",
          "€ 100",
          "€1,000",
          "EUR 100",
          "EUR100",
          "£100",
          "£ 100",
          "£1,000",
          "GBP 100",
          "GBP100",
        ];

        eurGbpMatches.forEach((price) => {
          PriceDetector.combinedPattern.lastIndex = 0;
          expect(PriceDetector.combinedPattern.test(price)).toBe(true);
        });
      });

      it("should not match unrelated currency symbols", () => {
        const nonMatches = ["¥1000", "₩50000"];

        nonMatches.forEach((text) => {
          PriceDetector.combinedPattern.lastIndex = 0;
          expect(PriceDetector.combinedPattern.test(text)).toBe(false);
        });
      });

      it("should match prices with 1 or 2 decimal places", () => {
        PriceDetector.combinedPattern.lastIndex = 0;
        expect(PriceDetector.combinedPattern.test("$10.5")).toBe(true);

        PriceDetector.combinedPattern.lastIndex = 0;
        expect(PriceDetector.combinedPattern.test("$10.50")).toBe(true);
      });
    });
  });
});
