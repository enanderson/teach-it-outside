import { useState, useEffect } from "react";

const SUBJECTS = [
  "Math", "ELA / Reading", "Science", "Social Studies",
  "Art", "Music", "PE / Health", "Social-Emotional Learning", "Other"
];

const WISCONSIN_CITIES = [
  { name: "Appleton", lat: 44.2619, lon: -88.4154 },
  { name: "Beloit", lat: 42.5084, lon: -89.0318 },
  { name: "Eau Claire", lat: 44.8113, lon: -91.4985 },
  { name: "Fond du Lac", lat: 43.7730, lon: -88.4471 },
  { name: "Green Bay", lat: 44.5133, lon: -88.0133 },
  { name: "Janesville", lat: 42.6828, lon: -89.0187 },
  { name: "Kenosha", lat: 42.5847, lon: -87.8212 },
  { name: "La Crosse", lat: 43.8014, lon: -91.2396 },
  { name: "Madison", lat: 43.0731, lon: -89.4012 },
  { name: "Milwaukee", lat: 43.0389, lon: -87.9065 },
  { name: "Oregon", lat: 42.9239, lon: -89.3840 },
  { name: "Oshkosh", lat: 44.0247, lon: -88.5426 },
  { name: "Racine", lat: 42.7261, lon: -87.7829 },
  { name: "Sheboygan", lat: 43.7508, lon: -87.7145 },
  { name: "Stevens Point", lat: 44.5236, lon: -89.5746 },
  { name: "Waukesha", lat: 43.0117, lon: -88.2315 },
  { name: "Wausau", lat: 44.9591, lon: -89.6301 },
  { name: "West Allis", lat: 43.0167, lon: -88.0070 },
  { name: "Wisconsin Rapids", lat: 44.3836, lon: -89.8176 },
  { name: "Rural Wisconsin", lat: 44.5, lon: -89.5 },
  { name: "Other Wisconsin", lat: 44.5, lon: -89.5 },
];

const OUTDOOR_FEATURES = [
  { id: "garden", label: "School garden / raised beds", icon: "🌱" },
  { id: "paved_courtyard", label: "Paved courtyard or blacktop", icon: "⬜" },
  { id: "field", label: "Grass field or lawn", icon: "🟩" },
  { id: "trees", label: "Trees or wooded area nearby", icon: "🌳" },
  { id: "sidewalk", label: "Sidewalk or walking path", icon: "🚶" },
  { id: "nature_area", label: "Natural area / prairie / wetland", icon: "🌾" },
  { id: "playground", label: "Playground equipment", icon: "🛝" },
  { id: "parking_lot", label: "Parking lot (open space)", icon: "🅿️" },
  { id: "stream", label: "Stream, pond, or water feature", icon: "💧" },
  { id: "garden_beds", label: "Flower beds or planters", icon: "🌸" },
];

const GRADES = ["K","1st","2nd","3rd","4th","5th","6th","7th","8th","9th","10th","11th","12th"];
const SEASONS = ["Fall", "Winter", "Spring", "Summer"];

const WMO_CODES = {
  0: { label: "Clear skies", icon: "☀️" },
  1: { label: "Mostly clear", icon: "🌤️" },
  2: { label: "Partly cloudy", icon: "⛅" },
  3: { label: "Overcast", icon: "☁️" },
  45: { label: "Foggy", icon: "🌫️" },
  48: { label: "Freezing fog", icon: "🌫️" },
  51: { label: "Light drizzle", icon: "🌦️" },
  53: { label: "Drizzle", icon: "🌦️" },
  55: { label: "Heavy drizzle", icon: "🌧️" },
  61: { label: "Light rain", icon: "🌧️" },
  63: { label: "Rain", icon: "🌧️" },
  65: { label: "Heavy rain", icon: "🌧️" },
  71: { label: "Light snow", icon: "🌨️" },
  73: { label: "Snow", icon: "❄️" },
  75: { label: "Heavy snow", icon: "❄️" },
  80: { label: "Rain showers", icon: "🌦️" },
  81: { label: "Rain showers", icon: "🌧️" },
  82: { label: "Heavy rain showers", icon: "🌧️" },
  95: { label: "Thunderstorms", icon: "⛈️" },
  96: { label: "Thunderstorms with hail", icon: "⛈️" },
  99: { label: "Thunderstorms with hail", icon: "⛈️" },
};

function getWeatherDesc(code) {
  return WMO_CODES[code] || { label: "Variable conditions", icon: "🌡️" };
}

function fToLabel(f) {
  if (f <= 25) return "very cold";
  if (f <= 40) return "cold";
  if (f <= 55) return "cool";
  if (f <= 70) return "mild";
  if (f <= 82) return "warm";
  return "hot";
}

export default function App() {
  const [inputMode, setInputMode] = useState("objectives");
  const [lessonText, setLessonText] = useState("");
  const [objectives, setObjectives] = useState("");
  const [standards, setStandards] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedFeatures, setSelectedFeatures] = useState([]);
  const [selectedGrade, setSelectedGrade] = useState("");
  const [selectedSeason, setSelectedSeason] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [planningAhead, setPlanningAhead] = useState(false);
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const cityObj = WISCONSIN_CITIES.find(c => c.name === selectedCity);

  useEffect(() => {
    if (!selectedCity || planningAhead) {
      setWeather(null);
      return;
    }
    if (!cityObj) return;

    setWeatherLoading(true);
    setWeather(null);

    const { lat, lon } = cityObj;
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,weathercode,precipitation_probability&temperature_unit=fahrenheit&timezone=America%2FChicago&forecast_days=1`
    )
      .then(r => r.json())
      .then(data => {
        const hours = data.hourly;
        // School hours: 8am-3pm = indices 8-15
        const schoolHours = Array.from({ length: 8 }, (_, i) => ({
          hour: hours.time[i + 8],
          temp: Math.round(hours.temperature_2m[i + 8]),
          code: hours.weathercode[i + 8],
          precip: hours.precipitation_probability[i + 8],
        }));

        const morningHours = schoolHours.slice(0, 4); // 8am-noon
        const afternoonHours = schoolHours.slice(4);  // noon-3pm

        const hasThunder = schoolHours.some(h => h.code >= 95);
        const morningStorms = morningHours.some(h => h.code >= 95);
        const afternoonStorms = afternoonHours.some(h => h.code >= 95);
        const hasRain = schoolHours.some(h => h.code >= 61 && h.code <= 82);
        const morningRain = morningHours.some(h => h.code >= 61 && h.code <= 82);
        const afternoonRain = afternoonHours.some(h => h.code >= 61 && h.code <= 82);
        const avgTemp = Math.round(schoolHours.reduce((s, h) => s + h.temp, 0) / schoolHours.length);
        const maxPrecip = Math.max(...schoolHours.map(h => h.precip));
        const currentCode = schoolHours[0].code;

        let windowSuggestion = null;
        if (morningStorms && !afternoonStorms) {
          windowSuggestion = { type: "warning", text: "Storms expected in the morning — afternoon may be the better window." };
        } else if (afternoonStorms && !morningStorms) {
          windowSuggestion = { type: "tip", text: "Afternoon storms expected — aim to go outside in the morning." };
        } else if (hasThunder) {
          windowSuggestion = { type: "warning", text: "Thunderstorms expected throughout the school day — consider an indoor backup." };
        } else if (morningRain && !afternoonRain) {
          windowSuggestion = { type: "tip", text: "Morning rain likely — afternoon may clear up." };
        } else if (afternoonRain && !morningRain) {
          windowSuggestion = { type: "tip", text: "Rain expected this afternoon — morning is the better window today." };
        } else if (avgTemp <= 25) {
          windowSuggestion = { type: "warning", text: "Very cold today — limit outdoor time and layer up." };
        }

        setWeather({ schoolHours, avgTemp, hasThunder, hasRain, maxPrecip, currentCode, windowSuggestion, morningHours, afternoonHours });
        setWeatherLoading(false);
      })
      .catch(() => {
        setWeather(null);
        setWeatherLoading(false);
      });
  }, [selectedCity, planningAhead]);

  const toggleFeature = (id) => {
    setSelectedFeatures(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const getInputContent = () => {
    if (inputMode === "objectives") return `Learning Objectives:\n${objectives}`;
    if (inputMode === "standards") return `Standards:\n${standards}`;
    return `Lesson Plan:\n${lessonText}`;
  };

  const hasInput = () => {
    if (inputMode === "objectives") return objectives.trim().length > 0;
    if (inputMode === "standards") return standards.trim().length > 0;
    return lessonText.trim().length > 0;
  };

  const handleCopy = () => {
    const plainText = result.replace(/DIVIDER/g, "\n---\n").replace(/\n{3,}/g, "\n\n").trim();
    navigator.clipboard.writeText(plainText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const buildWeatherContext = () => {
    if (planningAhead || !weather) return "";
    const { avgTemp, hasThunder, hasRain, maxPrecip, windowSuggestion, morningHours, afternoonHours } = weather;

    const morningDesc = getWeatherDesc(morningHours[0]?.code || 0);
    const afternoonDesc = getWeatherDesc(afternoonHours[0]?.code || 0);

    let ctx = `\nToday's weather forecast for ${selectedCity}:
- Morning (8am-noon): ${morningDesc.icon} ${morningDesc.label}, around ${morningHours[0]?.temp || avgTemp}°F
- Afternoon (noon-3pm): ${afternoonDesc.icon} ${afternoonDesc.label}, around ${afternoonHours[0]?.temp || avgTemp}°F
- Average temperature during school hours: ${avgTemp}°F (${fToLabel(avgTemp)})
- Precipitation chance: ${maxPrecip}%`;

    if (hasThunder) ctx += "\n- IMPORTANT: Thunderstorms are in the forecast. Outdoor activities should avoid or plan for lightning safety.";
    else if (hasRain) ctx += "\n- Rain is possible today — surfaces may be wet or muddy.";

    ctx += "\n\nPlease factor this forecast into your suggestions — mention the temperature, note any wet or muddy conditions if relevant, and recommend the best time of day to go outside if the forecast varies.";

    if (windowSuggestion) {
      ctx += `\n\nWeather window note: ${windowSuggestion.text}`;
    }

    return ctx;
  };

  const buildPrompt = () => {
    const featureLabels = selectedFeatures.map(id =>
      OUTDOOR_FEATURES.find(f => f.id === id)?.label
    ).filter(Boolean);

    const cityInfo = selectedCity ? `in ${selectedCity}, Wisconsin` : "in Wisconsin";
    const gradeInfo = selectedGrade ? `Grade level: ${selectedGrade}` : "";
    const seasonInfo = selectedSeason ? `Current/upcoming season: ${selectedSeason}` : "";
    const subjectInfo = selectedSubject ? `Subject area: ${selectedSubject}` : "";
    const weatherContext = buildWeatherContext();

    return `You are an experienced outdoor educator and curriculum specialist helping Wisconsin teachers move learning outside the classroom walls.

A teacher ${cityInfo} has shared the following lesson information:

${getInputContent()}

${gradeInfo}
${seasonInfo}
${subjectInfo}
${weatherContext}

Their school has access to these outdoor spaces/features:
${featureLabels.map(f => `- ${f}`).join("\n")}

Your job is to generate 2-3 specific, practical outdoor adaptations of this lesson that:
1. Preserve the original learning objectives completely
2. Use ONLY the outdoor features the teacher has checked
3. Are realistic for Wisconsin weather — be honest about cold, rain, mud, or storms${!planningAhead && weather ? " based on today's actual forecast" : " based on the season selected"}
4. Feel like natural extensions of the lesson, not forced "nature add-ons"
5. Include what materials the teacher needs to bring outside
6. When multiple outdoor spaces are available, spread suggestions across at least 2 different spaces — do not default to the same space for every activity
6. Are doable within a typical class period (30-50 minutes)
${!planningAhead && weather?.windowSuggestion ? "7. Recommend the best time of day to go outside given today's forecast" : ""}

For each adaptation, provide:
- A short creative name for the activity
- Which outdoor space it uses
- A 2-3 sentence description of what students actually do outside
- Materials needed
- One "Teacher tip" for managing the transition outdoors

Separate each activity with exactly one line containing only the word DIVIDER — no extra DIVIDER lines, no dashes, nothing else between activities.

You MUST always end every response with a section titled "A Note on Why This Works Differently Outside" — this is required, never skip it. Write one short paragraph in plain language, no jargon, that explains the neurological or sensory reason this specific lesson lands differently in an outdoor context than indoors.`;
  };

  const handleGenerate = async () => {
    if (!hasInput()) { setError("Please enter some lesson content first."); return; }
    if (selectedFeatures.length === 0) { setError("Please select at least one outdoor feature available at your school."); return; }

    setError("");
    setLoading(true);
    setResult("");

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-5",
          max_tokens: 1200,
          messages: [{ role: "user", content: buildPrompt() }]
        })
      });
      const data = await response.json();
      const text = data.content?.map(b => b.text || "").join("") || "";
      setResult(text);
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatResult = (text) => {
    // Collapse multiple consecutive DIVIDERs into one
    const cleaned = text.replace(/(DIVIDER[\s\n]*){2,}/g, "DIVIDER\n");
    return cleaned.split("\n").map((line, i) => {
      if (line.trim() === "DIVIDER" || line.trim() === "---") return <div key={i} className="result-divider" />;
      if (line.match(/^\*\*.*\*\*$/) || line.match(/^#+\s/)) {
        return <p key={i} className="result-heading">{line.replace(/^\*\*|\*\*$|^#+\s*/g, "")}</p>;
      }
      if (line.startsWith("- ") || line.startsWith("• ")) return <p key={i} className="result-bullet">{line.slice(2)}</p>;
      if (line.trim() === "") return <br key={i} />;
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      const rendered = parts.map((part, j) =>
        part.startsWith("**") && part.endsWith("**")
          ? <strong key={j}>{part.slice(2, -2)}</strong>
          : part
      );
      return <p key={i} className="result-line">{rendered}</p>;
    });
  };

  const weatherDisplay = () => {
    if (!selectedCity || planningAhead) return null;
    if (weatherLoading) return (
      <div className="weather-box loading">
        <span className="weather-spin">🌤️</span> Fetching today's forecast for {selectedCity}...
      </div>
    );
    if (!weather) return null;

    const { avgTemp, currentCode, windowSuggestion, morningHours, afternoonHours } = weather;
    const current = getWeatherDesc(currentCode);
    const morningDesc = getWeatherDesc(morningHours[0]?.code || 0);
    const afternoonDesc = getWeatherDesc(afternoonHours[0]?.code || 0);

    return (
      <div className="weather-box">
        <div className="weather-header">
          <span className="weather-icon">{current.icon}</span>
          <div>
            <div className="weather-title">Today in {selectedCity}</div>
            <div className="weather-sub">{avgTemp}°F avg during school hours · {fToLabel(avgTemp)}</div>
          </div>
        </div>
        <div className="weather-row">
          <div className="weather-half">
            <div className="weather-period">Morning</div>
            <div className="weather-cond">{morningDesc.icon} {morningDesc.label} · {morningHours[0]?.temp}°F</div>
          </div>
          <div className="weather-half">
            <div className="weather-period">Afternoon</div>
            <div className="weather-cond">{afternoonDesc.icon} {afternoonDesc.label} · {afternoonHours[0]?.temp}°F</div>
          </div>
        </div>
        {windowSuggestion && (
          <div className={`weather-tip ${windowSuggestion.type}`}>
            {windowSuggestion.type === "warning" ? "⚠️" : "💡"} {windowSuggestion.text}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="app">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;1,400&family=DM+Sans:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --moss: #3d5a3e; --sage: #7a9e7e; --sage-light: #b8d4bb;
          --cream: #f5f0e8; --bark: #5c4a32; --soil: #8b6f47;
          --sky: #d4e8f0; --sky-dark: #4a8fa8; --gold: #c8963e;
          --white: #fefdf9; --text: #2c2c2c; --text-light: #6b6b6b; --border: #d8cfc0;
        }
        body { background: var(--cream); }
        .app { font-family: 'DM Sans', sans-serif; min-height: 100vh; background: var(--cream); color: var(--text); display: flex; flex-direction: column; }
        .header { background: var(--moss); padding: 28px 32px 24px; position: relative; overflow: hidden; }
        .header::before { content: ''; position: absolute; bottom: -20px; left: -10%; right: -10%; height: 40px; background: var(--cream); border-radius: 50% 50% 0 0 / 100% 100% 0 0; }
        .header-inner { max-width: 760px; margin: 0 auto; position: relative; z-index: 1; }
        .logo { font-family: 'Lora', serif; font-size: 26px; color: var(--white); letter-spacing: -0.3px; margin-bottom: 4px; }
        .logo span { color: var(--sage-light); font-style: italic; }
        .tagline { font-size: 13px; color: var(--sage-light); letter-spacing: 0.5px; opacity: 0.85; }
        .main { max-width: 760px; margin: 0 auto; padding: 32px 20px 60px; }
        .section { background: var(--white); border: 1px solid var(--border); border-radius: 12px; padding: 24px; margin-bottom: 16px; }
        .section-title { font-family: 'Lora', serif; font-size: 15px; font-weight: 600; color: var(--moss); margin-bottom: 14px; display: flex; align-items: center; gap: 8px; }
        .section-title .step { background: var(--moss); color: white; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 600; flex-shrink: 0; }
        .tab-row { display: flex; gap: 6px; margin-bottom: 14px; flex-wrap: wrap; }
        .tab { padding: 7px 14px; border-radius: 20px; border: 1.5px solid var(--border); background: transparent; font-family: 'DM Sans', sans-serif; font-size: 13px; color: var(--text-light); cursor: pointer; transition: all 0.15s; }
        .tab.active { background: var(--moss); border-color: var(--moss); color: white; font-weight: 500; }
        .tab:hover:not(.active) { border-color: var(--sage); color: var(--moss); }
        textarea, select { width: 100%; padding: 12px 14px; border: 1.5px solid var(--border); border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: 14px; color: var(--text); background: var(--white); resize: vertical; outline: none; transition: border-color 0.15s; line-height: 1.5; }
        textarea:focus, select:focus { border-color: var(--sage); }
        textarea { min-height: 100px; }
        .row-two { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; } .row-three { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
        .field-label { font-size: 12px; font-weight: 600; color: var(--text-light); text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 6px; }
        .subject-grid { display: flex; flex-wrap: wrap; gap: 7px; }
        .subject-btn { padding: 6px 14px; border-radius: 20px; border: 1.5px solid var(--border); background: transparent; font-family: 'DM Sans', sans-serif; font-size: 13px; color: var(--text-light); cursor: pointer; transition: all 0.15s; }
        .subject-btn.active { background: var(--bark); border-color: var(--bark); color: white; font-weight: 500; }
        .subject-btn:hover:not(.active) { border-color: var(--soil); color: var(--bark); }
        .features-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .feature-btn { display: flex; align-items: center; gap: 9px; padding: 10px 13px; border: 1.5px solid var(--border); border-radius: 8px; background: transparent; cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 13px; color: var(--text); text-align: left; transition: all 0.15s; }
        .feature-btn:hover { border-color: var(--sage); background: #f0f7f1; }
        .feature-btn.selected { border-color: var(--moss); background: #eaf2eb; color: var(--moss); font-weight: 500; }
        .feature-btn .icon { font-size: 16px; flex-shrink: 0; }
        .check { margin-left: auto; width: 16px; height: 16px; border-radius: 4px; border: 1.5px solid var(--border); background: white; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 10px; transition: all 0.15s; }
        .feature-btn.selected .check { background: var(--moss); border-color: var(--moss); color: white; }

        .planning-toggle { display: flex; align-items: center; gap: 10px; margin-top: 14px; padding: 12px 14px; background: var(--cream); border-radius: 8px; border: 1px solid var(--border); cursor: pointer; user-select: none; }
        .toggle-track { width: 36px; height: 20px; border-radius: 10px; background: var(--border); position: relative; transition: background 0.2s; flex-shrink: 0; }
        .toggle-track.on { background: var(--sky-dark); }
        .toggle-thumb { position: absolute; top: 3px; left: 3px; width: 14px; height: 14px; border-radius: 50%; background: white; transition: left 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.2); }
        .toggle-track.on .toggle-thumb { left: 19px; }
        .toggle-label { font-size: 13px; color: var(--text); }
        .toggle-label strong { font-weight: 600; }

        .weather-box { margin-top: 14px; background: linear-gradient(135deg, #e8f4fd, #d4e8f0); border: 1px solid #b8d9ed; border-radius: 10px; padding: 14px 16px; }
        .weather-box.loading { display: flex; align-items: center; gap: 10px; font-size: 13px; color: var(--sky-dark); }
        .weather-spin { animation: spin 2s linear infinite; display: inline-block; }
        .weather-header { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
        .weather-icon { font-size: 28px; }
        .weather-title { font-weight: 600; font-size: 14px; color: var(--sky-dark); }
        .weather-sub { font-size: 12px; color: #5a8fa8; margin-top: 1px; }
        .weather-row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px; }
        .weather-half { background: rgba(255,255,255,0.5); border-radius: 7px; padding: 8px 10px; }
        .weather-period { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #5a8fa8; margin-bottom: 3px; }
        .weather-cond { font-size: 13px; color: var(--text); }
        .weather-tip { margin-top: 8px; padding: 8px 12px; border-radius: 7px; font-size: 13px; line-height: 1.45; }
        .weather-tip.tip { background: rgba(255,255,255,0.6); color: #2a6b3a; border: 1px solid #a8d4b0; }
        .weather-tip.warning { background: #fff8e6; color: #7a5a00; border: 1px solid #f0d070; }

        .generate-btn { width: 100%; padding: 16px; background: var(--moss); color: white; border: none; border-radius: 10px; font-family: 'Lora', serif; font-size: 17px; font-weight: 600; cursor: pointer; transition: all 0.2s; letter-spacing: 0.2px; margin-top: 4px; }
        .generate-btn:hover:not(:disabled) { background: #2e4530; transform: translateY(-1px); box-shadow: 0 4px 16px rgba(61,90,62,0.25); }
        .generate-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .error { background: #fff0f0; border: 1px solid #f5c0c0; color: #b33; border-radius: 8px; padding: 12px 14px; font-size: 13px; margin-bottom: 14px; }
        .result-section { background: var(--white); border: 1.5px solid var(--sage-light); border-radius: 12px; padding: 24px; margin-top: 20px; }
        .result-header { display: flex; align-items: center; gap: 8px; margin-bottom: 18px; padding-bottom: 14px; border-bottom: 1px solid var(--border); flex-wrap: wrap; }
        .result-header-text { font-family: 'Lora', serif; font-size: 15px; color: var(--moss); font-weight: 600; flex: 1; }
        .result-badge { background: var(--sage-light); color: var(--moss); font-size: 11px; font-weight: 600; padding: 3px 9px; border-radius: 20px; letter-spacing: 0.4px; }
        .result-divider { border: none; border-top: 1.5px dashed var(--sage-light); margin: 20px 0; }
        .result-heading { font-family: 'Lora', serif; font-size: 15px; font-weight: 600; color: var(--bark); margin: 14px 0 6px; }
        .result-line { font-size: 14px; line-height: 1.65; color: var(--text); margin-bottom: 4px; }
        .result-bullet { font-size: 14px; line-height: 1.6; color: var(--text); padding-left: 16px; position: relative; margin-bottom: 3px; }
        .result-bullet::before { content: '·'; position: absolute; left: 4px; color: var(--sage); font-weight: bold; }
        .result-actions { display: flex; gap: 8px; margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--border); }
        .action-btn { padding: 9px 18px; border-radius: 8px; border: 1.5px solid var(--border); background: transparent; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.15s; color: var(--text); }
        .action-btn:hover { border-color: var(--sage); color: var(--moss); background: #f0f7f1; }
        .action-btn.primary { background: var(--moss); border-color: var(--moss); color: white; }
        .action-btn.primary:hover { background: #2e4530; color: white; }
        .loading-wrap { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 32px 0; color: var(--text-light); font-size: 14px; }
        .leaf-spin { font-size: 28px; animation: spin 1.5s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .wi-chip { display: inline-flex; align-items: center; gap: 5px; background: var(--sky); color: var(--sky-dark); font-size: 11px; font-weight: 600; padding: 3px 9px; border-radius: 20px; letter-spacing: 0.3px; }
        @media (max-width: 560px) {
          .features-grid { grid-template-columns: 1fr; }
          .row-three { grid-template-columns: 1fr 1fr; }
          .weather-row { grid-template-columns: 1fr; }
          .result-actions { flex-direction: column; }
        }
      `}</style>

      <div className="header">
        <div className="header-inner">
          <div className="logo">Teach It <span>Outside</span></div>
          <div className="tagline">Adapt any lesson for outdoor learning · Wisconsin schools</div>
        </div>
      </div>

      <div className="main">

        <div className="section">
          <div className="section-title"><span className="step">1</span>Tell us about your lesson</div>
          <div className="tab-row">
            {["objectives","standards","lesson"].map(mode => (
              <button key={mode} className={`tab ${inputMode === mode ? "active" : ""}`} onClick={() => setInputMode(mode)}>
                {mode === "objectives" ? "Learning objectives" : mode === "standards" ? "Standards" : "Paste lesson plan"}
              </button>
            ))}
          </div>
          {inputMode === "objectives" && <textarea placeholder="e.g. Students will use multiplication to solve real-world area problems..." value={objectives} onChange={e => setObjectives(e.target.value)} />}
          {inputMode === "standards" && <textarea placeholder="e.g. CCSS.MATH.CONTENT.3.MD.C.7 — Relate area to multiplication and addition..." value={standards} onChange={e => setStandards(e.target.value)} />}
          {inputMode === "lesson" && <textarea placeholder="Paste your lesson plan text here..." value={lessonText} onChange={e => setLessonText(e.target.value)} style={{ minHeight: 150 }} />}
          <div style={{ marginTop: 16 }}>
            <div className="field-label">Subject area <span style={{fontWeight:400,textTransform:'none',letterSpacing:0}}>(optional)</span></div>
            <div className="subject-grid">
              {SUBJECTS.map(s => (
                <button key={s} className={`subject-btn ${selectedSubject === s ? "active" : ""}`} onClick={() => setSelectedSubject(prev => prev === s ? "" : s)}>{s}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="section">
          <div className="section-title"><span className="step">2</span>Your school context &nbsp;<span className="wi-chip">Wisconsin</span></div>
          <div className="row-two" style={{ marginBottom: 14 }}>
            <div>
              <div className="field-label">City or region</div>
              <select value={selectedCity} onChange={e => { setSelectedCity(e.target.value); setResult(""); }}>
                <option value="">Select...</option>
                {WISCONSIN_CITIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <div className="field-label">Grade level</div>
              <select value={selectedGrade} onChange={e => setSelectedGrade(e.target.value)}>
                <option value="">Select...</option>
                {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>

          <div className="planning-toggle" onClick={() => setPlanningAhead(p => !p)}>
            <div className={`toggle-track ${planningAhead ? "on" : ""}`}>
              <div className="toggle-thumb" />
            </div>
            <div className="toggle-label">
              Planning ahead for a future lesson? Use seasonal climate instead of today's forecast.
            </div>
          </div>

          {planningAhead && (
            <div style={{ marginTop: 10 }}>
              <div className="field-label" style={{ marginBottom: 6 }}>Which season?</div>
              <select value={selectedSeason} onChange={e => setSelectedSeason(e.target.value)}>
                <option value="">Select a season...</option>
                {SEASONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )}

          {weatherDisplay()}
        </div>

        <div className="section">
          <div className="section-title"><span className="step">3</span>What outdoor spaces does your school have?</div>
          <div className="features-grid">
            {OUTDOOR_FEATURES.map(f => (
              <button key={f.id} className={`feature-btn ${selectedFeatures.includes(f.id) ? "selected" : ""}`} onClick={() => toggleFeature(f.id)}>
                <span className="icon">{f.icon}</span>
                <span>{f.label}</span>
                <span className="check">{selectedFeatures.includes(f.id) ? "✓" : ""}</span>
              </button>
            ))}
          </div>
        </div>

        {error && <div className="error">{error}</div>}

        <button className="generate-btn" onClick={handleGenerate} disabled={loading}>
          {loading ? "Finding outdoor adaptations..." : "Take this lesson outside →"}
        </button>

        {loading && (
          <div className="result-section">
            <div className="loading-wrap"><span className="leaf-spin">🍃</span><span>Thinking about your outdoor spaces...</span></div>
          </div>
        )}

        {result && !loading && (
          <div className="result-section">
            <div className="result-header">
              <span style={{ fontSize: 20 }}>🌿</span>
              <span className="result-header-text">Outdoor Adaptations</span>
              {selectedSubject && <span className="result-badge">{selectedSubject}</span>}
              {selectedCity && <span className="result-badge">{selectedCity}, WI</span>}
              {selectedGrade && <span className="result-badge">Grade {selectedGrade}</span>}
              {!planningAhead && weather ? <span className="result-badge">📡 Live forecast</span> : selectedSeason ? <span className="result-badge">{selectedSeason}</span> : null}
            </div>
            <div>{formatResult(result)}</div>
            <div className="result-actions">
              <button className="action-btn primary" onClick={handleCopy}>{copied ? "✓ Copied!" : "Copy to clipboard"}</button>
              <button className="action-btn" onClick={handleGenerate}>Try another approach</button>
            </div>
          </div>
        )}
     </div>
    <footer style={{backgroundColor:'#2d4a2d',color:'rgba(255,255,255,0.85)',padding:'1.5rem 2rem',fontSize:'13px',lineHeight:'1.6'}}>
      <div style={{maxWidth:'760px',margin:'0 auto',display:'flex',flexDirection:'column',alignItems:'center',gap:'6px',textAlign:'center'}}>
        <span style={{fontWeight:500,fontSize:'14px'}}>Teach It Outside — Built for Wisconsin teachers</span>
        <span style={{opacity:0.75}}>🔒 We don't store your data. Lessons are generated via the Anthropic API and not saved. Avoid entering student names.</span>
        <span style={{opacity:0.75}}>Teach It Outside is currently in beta. <a href="mailto:myco.ed.wi@gmail.com" style={{color:'inherit'}}>Email</a> for feedback.</span> 
        <span style={{opacity:0.75}}>© 2026 MYCO LLC. All rights reserved.</span>
      </div>
    </footer>
    </div>
  );
}
