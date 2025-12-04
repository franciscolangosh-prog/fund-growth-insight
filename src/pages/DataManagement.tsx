import { useState, useEffect } from "react";
import { FileUpload } from "@/components/FileUpload";
import { PortfolioSelector } from "@/components/PortfolioSelector";
import { RecordsEditorDialog } from "@/components/RecordsEditorDialog";
import { DataMigrationPanel } from "@/components/DataMigrationPanel";
import { CronJobManager } from "@/components/CronJobManager";
import { Navigation } from "@/components/Navigation";
import {
  parseCSV,
  PortfolioData,
} from "@/utils/portfolioAnalysis";
import {
  savePortfolioToDatabase,
  loadPortfolioFromDatabase,
  listPortfolios,
} from "@/utils/portfolioDatabase";

const DataManagement = () => {
  const [loading, setLoading] = useState(true);
  const [portfolios, setPortfolios] = useState<any[]>([]);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string | null>(null);

  const loadPortfoliosList = async () => {
    const portfolioList = await listPortfolios();
    setPortfolios(portfolioList);
    
    if (portfolioList.length > 0 && !selectedPortfolioId) {
      setSelectedPortfolioId(portfolioList[0].id);
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      const portfolioList = await listPortfolios();
      setPortfolios(portfolioList);

      if (portfolioList.length > 0) {
        setSelectedPortfolioId(portfolioList[0].id);
      } else {
        // Load default CSV and save to database
        try {
          const response = await fetch("/PORTFOLIO_SNAPSHOT.csv");
          const csvText = await response.text();
          const parseResult = parseCSV(csvText);
          
          if (parseResult.errors.length > 0) {
            console.error("Error parsing default portfolio:", parseResult.errors);
          } else if (parseResult.data.length > 0) {
            const portfolioId = await savePortfolioToDatabase("Default Portfolio", parseResult.data);
            if (portfolioId) {
              setSelectedPortfolioId(portfolioId);
              await loadPortfoliosList();
            }
          }
        } catch (error) {
          console.error("Error loading default portfolio data:", error);
        }
      }
      
      setLoading(false);
    };

    initializeData();
  }, []);

  const handleFileUploaded = async () => {
    await loadPortfoliosList();
  };

  const handleRecordSaved = async () => {
    // Refresh portfolios list in case any data changed
    await loadPortfoliosList();
  };

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-background">
          <div className="text-center">
            <h2 className="text-2xl font-bold">Loading...</h2>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="min-h-[calc(100vh-3.5rem)] bg-background p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Data Management</h1>
            <p className="text-muted-foreground">
              Upload, manage, and configure your portfolio data
            </p>
          </div>

          <div className="flex items-center gap-4">
            <PortfolioSelector
              portfolios={portfolios}
              selectedPortfolioId={selectedPortfolioId}
              onSelectPortfolio={setSelectedPortfolioId}
              onPortfoliosChange={loadPortfoliosList}
            />
            {selectedPortfolioId && (
              <RecordsEditorDialog
                portfolioId={selectedPortfolioId}
                onRecordSaved={handleRecordSaved}
              />
            )}
          </div>

          <FileUpload onFileUploaded={handleFileUploaded} />

          <DataMigrationPanel />

          <CronJobManager />
        </div>
      </div>
    </>
  );
};

export default DataManagement;
