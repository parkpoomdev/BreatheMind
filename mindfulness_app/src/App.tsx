import {
  IonApp,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonMenu,
  IonMenuToggle,
  IonModal,
  IonPage,
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToolbar
} from "@ionic/react";
import { menuController } from "@ionic/core";
import { useEffect, useMemo, useRef, useState } from "react";
import { ProgressRing } from "./components/ProgressRing";
import { PhaseSegmentsRing } from "./components/PhaseSegmentsRing";
import { usePhaseAudio } from "./hooks/usePhaseAudio";
import { moonOutline, personCircleOutline, settingsOutline, sunnyOutline } from "ionicons/icons";

type ModeOption = {
  value: string;
  name: string;
  pattern: string;
  ratios: number[];
  phases: { label: string; count: number }[];
};

const MODE_OPTIONS: ModeOption[] = [
  {
    value: "balanced-448",
    name: "Balanced Calm",
    pattern: "4-4-8",
    ratios: [4, 4, 8],
    phases: [
      { label: "Inhale", count: 4 },
      { label: "Hold", count: 4 },
      { label: "Exhale", count: 8 }
    ]
  },
  {
    value: "box-4444",
    name: "Box Breath",
    pattern: "4-4-4-4",
    ratios: [4, 4, 4, 4],
    phases: [
      { label: "Inhale", count: 4 },
      { label: "Hold", count: 4 },
      { label: "Exhale", count: 4 },
      { label: "Hold", count: 4 }
    ]
  },
  {
    value: "resonant-55",
    name: "Resonant Flow",
    pattern: "5.5-5.5",
    ratios: [5.5, 5.5],
    phases: [
      { label: "Inhale", count: 5.5 },
      { label: "Exhale", count: 5.5 }
    ]
  },
  {
    value: "ratio-12",
    name: "Long Exhale",
    pattern: "1-2",
    ratios: [1, 2],
    phases: [
      { label: "Inhale", count: 1 },
      { label: "Exhale", count: 2 }
    ]
  }
];

const PRESET_TIMES = [10, 15, 20, 25, 30] as const;
const MAX_MINUTES = 90;

const formatTime = (totalSeconds: number): string => {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (safeSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
};

const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, value));

export default function App() {
  const [mode, setMode] = useState<string>(MODE_OPTIONS[0]?.value ?? "balanced-448");
  const [minutes, setMinutes] = useState<number>(PRESET_TIMES[0]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(minutes * 60);
  const [guide, setGuide] = useState<ModeOption | null>(null);
  const [showGuide, setShowGuide] = useState<boolean>(false);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const initialMountRef = useRef(true);
  const { playPhaseTone, resetAudio } = usePhaseAudio();
  const phaseIndexRef = useRef<number | null>(null);

  const previousMinutesRef = useRef(minutes);

  useEffect(() => {
    if (!isRunning && previousMinutesRef.current !== minutes) {
      setTimeLeft(minutes * 60);
    }
    previousMinutesRef.current = minutes;
  }, [minutes, isRunning]);

  useEffect(() => {
    if (!isRunning) {
      return;
    }

    const interval = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(interval);
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [isRunning]);

  const totalSeconds = useMemo(() => Math.max(1, minutes * 60), [minutes]);
  const progress = useMemo(() => clamp(1 - timeLeft / totalSeconds), [timeLeft, totalSeconds]);

  const activeMode = MODE_OPTIONS.find((option) => option.value === mode);
  const activePattern = activeMode?.pattern ?? "";
  const phaseRatios = activeMode?.ratios ?? [];
  const statusText = isRunning ? "In Session" : timeLeft === minutes * 60 ? "Ready" : "Paused";

  const cycleUnitTotal = useMemo(
    () => phaseRatios.reduce((sum, value) => (value > 0 ? sum + value : sum), 0),
    [phaseRatios]
  );

  const elapsedTotal = useMemo(() => Math.max(0, minutes * 60 - timeLeft), [minutes, timeLeft]);

  const cycleProgress = useMemo(() => {
    if (cycleUnitTotal <= 0) {
      return 0;
    }
    const cycleLength = cycleUnitTotal;
    const currentInCycle = elapsedTotal % cycleLength;
    return currentInCycle / cycleLength;
  }, [cycleUnitTotal, elapsedTotal]);

  const handleTimeSelect = (value: number) => {
    setMinutes(value);
  };

  const handleIncrement = () => {
    setMinutes((current) => clamp(current + 5, 5, MAX_MINUTES));
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(minutes * 60);
  };

  const handleStartPause = () => {
    setIsRunning((prev) => {
      if (!prev && timeLeft <= 0) {
        setTimeLeft(minutes * 60);
        return true;
      }
      return !prev;
    });
  };

  useEffect(() => {
    if (initialMountRef.current) {
      initialMountRef.current = false;
      return;
    }
    const selected = MODE_OPTIONS.find((option) => option.value === mode) ?? null;
    if (selected) {
      setGuide(selected);
      setShowGuide(true);
    }
  }, [mode]);

  useEffect(() => {
    phaseIndexRef.current = null;
  }, [phaseRatios]);

  useEffect(() => {
    if (!isRunning) {
      phaseIndexRef.current = null;
      resetAudio();
      return;
    }
    if (!phaseRatios.length || cycleUnitTotal <= 0) {
      return;
    }
    const total = cycleUnitTotal;
    const safeRatios = phaseRatios.map((value) => (value > 0 ? value : 0));
    const cumulative: number[] = [];
    let acc = 0;
    safeRatios.forEach((value) => {
      acc += value;
      cumulative.push(acc / total);
    });

    const currentIdx = cumulative.findIndex((end) => cycleProgress < end);
    const index = currentIdx === -1 ? safeRatios.length - 1 : currentIdx;

    if (phaseIndexRef.current === null || phaseIndexRef.current !== index) {
      playPhaseTone(index);
      phaseIndexRef.current = index;
    }
  }, [cycleProgress, cycleUnitTotal, isRunning, phaseRatios, playPhaseTone, resetAudio]);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.body.dataset.theme = theme;
    }
  }, [theme]);

  const themeIcon = theme === "dark" ? sunnyOutline : moonOutline;
  const themeLabel = theme === "dark" ? "Light mode" : "Dark mode";
  const toggleTheme = () => setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  const openConfigMenu = () => {
    menuController.open("config-menu").catch(() => {});
  };

  return (
    <IonApp>
      <IonPage>
        <IonMenu side="start" menuId="config-menu" contentId="main-content" swipeGesture>
          <IonContent className={`menu-content ${theme}`}>
            <div className="menu-shell">
              <div className="menu-user">
                <IonIcon icon={personCircleOutline} className="menu-user__icon" />
                <div>
                  <div className="menu-user__name">Mindful Guest</div>
                  <div className="menu-user__status">Ready to breathe</div>
                </div>
              </div>
              <div className="menu-actions">
                <button type="button" className="menu-action" onClick={toggleTheme}>
                  <IonIcon icon={themeIcon} className="menu-action__icon" />
                  <span>{themeLabel}</span>
                </button>
                <IonMenuToggle autoHide>
                  <button type="button" className="menu-action secondary">
                    <IonIcon icon={settingsOutline} className="menu-action__icon" />
                    <span>Session configuration</span>
                  </button>
                </IonMenuToggle>
              </div>
            </div>
          </IonContent>
        </IonMenu>

        <IonContent id="main-content" fullscreen className={`app-content ${theme}`}>
          <div className="app-shell">
            <div className="session-wrapper">
              <IonCard className="session-card">
                <IonCardContent>
                  <IonItem lines="none" className="mode-select">
                    <IonSelect
                      label="Breathwork category"
                      labelPlacement="stacked"
                      value={mode}
                      interface="popover"
                      onIonChange={(event) => {
                        const next = event.detail.value as string | undefined;
                        if (typeof next === "string") {
                          setMode(next);
                        }
                      }}
                    >
                      {MODE_OPTIONS.map((option) => (
                        <IonSelectOption key={option.value} value={option.value}>
                          {`${option.name} (${option.pattern})`}
                        </IonSelectOption>
                      ))}
                    </IonSelect>
                  </IonItem>

                  <div className="time-grid">
                    {PRESET_TIMES.map((value) => {
                      const active = minutes === value;
                      return (
                        <button
                          type="button"
                          key={value}
                          className={`time-chip ${active ? "time-chip--active" : ""}`}
                          onClick={() => handleTimeSelect(value)}
                        >
                          {value}
                        </button>
                      );
                    })}
                    <button type="button" className="time-chip" onClick={handleIncrement}>
                      +5
                    </button>
                  </div>

                  <div className="timer-block" role="status" aria-live="polite">
                    <div className="status-text">{statusText}</div>
                    <div className="progress-shell">
                      <ProgressRing progress={progress} />
                      <PhaseSegmentsRing ratios={phaseRatios} progress={cycleProgress} />
                      <div className="progress-overlay">
                        <span className="overlay-pattern">{activePattern}</span>
                        <strong className="overlay-timer">{formatTime(timeLeft)}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="control-actions">
                    <IonButton expand="block" shape="round" className="action-primary" onClick={handleStartPause}>
                      {isRunning ? "Pause" : "Start"}
                    </IonButton>
                    <div className="control-divider" aria-hidden="true">
                      <span>|</span>
                    </div>
                    <IonButton expand="block" fill="outline" shape="round" className="action-reset" onClick={handleReset}>
                      Reset
                    </IonButton>
                  </div>
                </IonCardContent>
              </IonCard>

              <p className="footer-note">Add custom ratios, audio cues, or haptics once the timing feels right.</p>
            </div>
          </div>
        </IonContent>

        <IonModal isOpen={showGuide} onDidDismiss={() => setShowGuide(false)}>
          <IonHeader translucent>
            <IonToolbar>
              <IonTitle>{guide ? `${guide.name} (${guide.pattern})` : "Breathwork Guide"}</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowGuide(false)}>Close</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            {guide ? (
              <div className="guide-content">
                <p className="guide-summary">
                  1 cycle = {guide.pattern.split("-").join(" + ")} counts. Follow each phase in order:
                </p>
                <ul className="guide-phase-list">
                  {guide.phases.map((phase, index) => (
                    <li key={`${phase.label}-${index}`}>
                      <span className="guide-phase-label">{phase.label}</span>
                      <span className="guide-phase-count">{phase.count} counts</span>
                    </li>
                  ))}
                </ul>
                <p className="guide-note">
                  Tip: Breathe steadily so each count feels even. The inner ring will loop through these phases every
                  cycle.
                </p>
              </div>
            ) : (
              <p className="guide-placeholder">Select a pattern to see its breakdown.</p>
            )}
          </IonContent>
        </IonModal>
      </IonPage>
    </IonApp>
  );
}
