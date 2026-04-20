import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePreferences } from "../context/PreferencesContext";
import { Chip } from "../components/ui";
import { CUISINES, PRICE_LABELS } from "../utils/constants";
import { ROUTES } from "../utils/routes";
import "./Onboarding.css";

const STEPS = ["Cuisines", "Budget", "Tastes"];

const Onboarding = () => {
  const navigate = useNavigate();
  const { savePreferences } = usePreferences();

  const [step, setStep] = useState(0);
  const [cuisines, setCuisines] = useState([]);
  const [price, setPrice] = useState("");
  const [liked, setLiked] = useState("");
  const [disliked, setDisliked] = useState("");
  const [saving, setSaving] = useState(false);

  const toggleCuisine = (c) =>
    setCuisines((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );

  const handleFinish = async () => {
    setSaving(true);
    try {
      await savePreferences({
        favoriteCuisines: cuisines,
        preferredPriceRange: price,
        likedFoods: liked,
        dislikedFoods: disliked,
      });
    } catch {
      // non-fatal — prefs can be set later in Profile
    } finally {
      localStorage.removeItem("munchmate_needs_onboarding");
      navigate(ROUTES.HOME);
    }
  };

  const canAdvance = step === 0 ? cuisines.length > 0 : true;

  return (
    <div className="onboarding-page">
      <div className="onboarding-card">

        {/* Progress bar */}
        <div className="onboarding-progress">
          {STEPS.map((label, i) => (
            <div key={label} className={`onboarding-step${i <= step ? " onboarding-step--active" : ""}`}>
              <div className="onboarding-step__dot">{i < step ? "✓" : i + 1}</div>
              <span className="onboarding-step__label">{label}</span>
            </div>
          ))}
          <div
            className="onboarding-progress__bar"
            style={{ width: `${(step / (STEPS.length - 1)) * 100}%` }}
          />
        </div>

        {/* Step 1 — Cuisines */}
        {step === 0 && (
          <div className="onboarding-body">
            <div className="onboarding-logo">
              <img src="/logo.png" alt="MunchMate" />
              <span>MunchMate</span>
            </div>
            <h1>What cuisines do you love?</h1>
            <p>Pick at least one so we can personalize your recommendations.</p>
            <div className="onboarding-chips">
              {CUISINES.map((c) => (
                <Chip
                  key={c}
                  selected={cuisines.includes(c)}
                  onClick={() => toggleCuisine(c)}
                >
                  {c}
                </Chip>
              ))}
            </div>
          </div>
        )}

        {/* Step 2 — Budget */}
        {step === 1 && (
          <div className="onboarding-body">
            <h1>What's your typical budget?</h1>
            <p>We'll use this to filter recommendations to your price range.</p>
            <div className="onboarding-prices">
              {PRICE_LABELS.map((p) => (
                <button
                  key={p}
                  className={`onboarding-price-btn${price === p ? " onboarding-price-btn--active" : ""}`}
                  onClick={() => setPrice(p === price ? "" : p)}
                >
                  <span className="onboarding-price-symbol">{p}</span>
                  <span className="onboarding-price-label">
                    {p === "$" ? "Budget" : p === "$$" ? "Moderate" : p === "$$$" ? "Upscale" : "Fine dining"}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3 — Tastes */}
        {step === 2 && (
          <div className="onboarding-body">
            <h1>Anything else to know?</h1>
            <p>Help the AI give you even better picks. This is optional.</p>
            <div className="onboarding-inputs">
              <div className="onboarding-input-group">
                <label>Foods you love</label>
                <input
                  type="text"
                  placeholder="e.g. spicy food, seafood, pasta"
                  value={liked}
                  onChange={(e) => setLiked(e.target.value)}
                />
              </div>
              <div className="onboarding-input-group">
                <label>Foods you avoid</label>
                <input
                  type="text"
                  placeholder="e.g. nuts, gluten, dairy"
                  value={disliked}
                  onChange={(e) => setDisliked(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="onboarding-actions">
          {step > 0 && (
            <button className="onboarding-btn onboarding-btn--ghost" onClick={() => setStep(step - 1)}>
              Back
            </button>
          )}
          <button
            className="onboarding-btn onboarding-btn--skip"
            onClick={() => {
              localStorage.removeItem("munchmate_needs_onboarding");
              navigate(ROUTES.HOME);
            }}
          >
            Skip for now
          </button>
          {step < STEPS.length - 1 ? (
            <button
              className="onboarding-btn onboarding-btn--primary"
              onClick={() => setStep(step + 1)}
              disabled={!canAdvance}
            >
              Next
            </button>
          ) : (
            <button
              className="onboarding-btn onboarding-btn--primary"
              onClick={handleFinish}
              disabled={saving}
            >
              {saving ? "Saving…" : "Get Started"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
