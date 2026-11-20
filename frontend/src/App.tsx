import React, { useState, useEffect } from 'react';
import { Sidebar, NavItemKey } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { LandingView } from './views/LandingView';
import { DashboardView } from './views/DashboardView';
import { ModelHubView } from './views/ModelHubView';
import { DatasetStudioView } from './views/DatasetStudioView';
import { FineTuningView } from './views/FineTuningView';
import { PlaygroundView } from './views/PlaygroundView';
import { ModelComparisonView } from './views/ModelComparisonView';
import { EvaluationView } from './views/EvaluationView';
import { ExperimentsView } from './views/ExperimentsView';
import { ReportsView } from './views/ReportsView';
import { SettingsView } from './views/SettingsView';

import {
  HealthStatus,
  HardwareInfo,
  ModelCard,
  DatasetMetadata,
  ExperimentSummary,
} from './types';
import {
  getHealth,
  getHardwareInfo,
  getModels,
  getDatasets,
  getExperiments,
} from './api/client';

export function App() {
  const [currentView, setCurrentView] = useState<NavItemKey>('dashboard');
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [hardware, setHardware] = useState<HardwareInfo | null>(null);
  const [models, setModels] = useState<ModelCard[]>([]);
  const [datasets, setDatasets] = useState<DatasetMetadata[]>([]);
  const [experiments, setExperiments] = useState<ExperimentSummary[]>([]);
  const [pingMs, setPingMs] = useState<number | null>(null);

  const fetchHealthAndHardware = async () => {
    const start = performance.now();
    try {
      const h = await getHealth();
      const latency = Math.round(performance.now() - start);
      setHealth(h);
      setPingMs(latency);
    } catch {
      setHealth(null);
      setPingMs(null);
    }

    try {
      const hw = await getHardwareInfo();
      setHardware(hw);
    } catch {
      // Hardware optional if cloud mode
    }
  };

  const fetchModels = async () => {
    try {
      const data = await getModels();
      setModels(data);
    } catch (err) {
      console.error('Failed to fetch models', err);
    }
  };

  const fetchDatasets = async () => {
    try {
      const data = await getDatasets();
      setDatasets(data);
    } catch (err) {
      console.error('Failed to fetch datasets', err);
    }
  };

  const fetchExperiments = async () => {
    try {
      const data = await getExperiments();
      setExperiments(data);
    } catch (err) {
      console.error('Failed to fetch experiments', err);
    }
  };

  useEffect(() => {
    fetchHealthAndHardware();
    fetchModels();
    fetchDatasets();
    fetchExperiments();

    const interval = setInterval(fetchHealthAndHardware, 10000);
    return () => clearInterval(interval);
  }, []);

  const viewTitles: Record<NavItemKey, string> = {
    landing: 'Platform Overview',
    dashboard: 'Dashboard',
    models: 'Pretrained Model Hub',
    datasets: 'Dataset Studio',
    training: 'LoRA Fine-Tuning Studio',
    playground: 'LLM Inference Playground',
    comparison: 'Side-by-Side Model Comparison',
    evaluation: 'Quantitative Model Evaluation',
    experiments: 'Experiment Management',
    reports: 'Technical & Academic Reports',
    settings: 'System & Deployment Settings',
  };

  const mlEngineOnline = health?.ml_engine_enabled ?? false;

  return (
    <div className="flex h-screen w-screen bg-bg-main overflow-hidden text-text-main font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        onSelectView={(view) => setCurrentView(view)}
        mlEngineOnline={mlEngineOnline}
        activeModelName={health?.active_model}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Navbar
          currentViewTitle={viewTitles[currentView]}
          health={health}
          hardware={hardware}
          pingMs={pingMs}
          onRefreshHardware={fetchHealthAndHardware}
        />

        <main className="flex-1 overflow-y-auto">
          {currentView === 'landing' && (
            <LandingView
              onNavigate={(v) => setCurrentView(v)}
              mlEngineOnline={mlEngineOnline}
            />
          )}

          {currentView === 'dashboard' && (
            <DashboardView
              onNavigate={(v) => setCurrentView(v)}
              models={models}
              datasets={datasets}
              experiments={experiments}
              hardware={hardware}
              health={health}
            />
          )}

          {currentView === 'models' && (
            <ModelHubView
              models={models}
              onRefreshModels={fetchModels}
              mlEngineOnline={mlEngineOnline}
            />
          )}

          {currentView === 'datasets' && (
            <DatasetStudioView
              datasets={datasets}
              onRefreshDatasets={fetchDatasets}
              onNavigateToTraining={() => setCurrentView('training')}
            />
          )}

          {currentView === 'training' && (
            <FineTuningView
              models={models}
              datasets={datasets}
              hardware={hardware}
              onNavigate={(v) => setCurrentView(v)}
              onRefreshExperiments={fetchExperiments}
            />
          )}

          {currentView === 'playground' && (
            <PlaygroundView
              models={models}
              experiments={experiments}
              mlEngineOnline={mlEngineOnline}
            />
          )}

          {currentView === 'comparison' && (
            <ModelComparisonView
              models={models}
              experiments={experiments}
              mlEngineOnline={mlEngineOnline}
            />
          )}

          {currentView === 'evaluation' && (
            <EvaluationView
              models={models}
              datasets={datasets}
              experiments={experiments}
            />
          )}

          {currentView === 'experiments' && (
            <ExperimentsView
              experiments={experiments}
              onRefreshExperiments={fetchExperiments}
              onNavigate={(v) => setCurrentView(v)}
            />
          )}

          {currentView === 'reports' && (
            <ReportsView experiments={experiments} />
          )}

          {currentView === 'settings' && (
            <SettingsView
              hardware={hardware}
              health={health}
              onRefreshHardware={fetchHealthAndHardware}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
