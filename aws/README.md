# AWS Resources - Aligno Project

Ten folder zawiera wszystkie zasoby związane z AWS dla projektu Aligno.

## 📁 Struktura

```
aws/
├── deployment/                 # Deployment scripts i konfiguracje
│   └── scraper/               # Deployment scrapera na AWS Fargate
│       ├── Dockerfile
│       ├── deploy.sh
│       ├── quick-deploy.sh
│       └── ...
└── cleanup/                    # Skrypty do czyszczenia zasobów
    └── scraper/               # Cleanup dla scrapera
        └── cleanup-aws.sh
```

## 🚀 Deployment

### Scraper (AWS Fargate Scheduled Task)

**Deployment mode:** Scheduled Task - uruchamia się codziennie o 2 AM UTC

**Pierwszy deploy (pełna konfiguracja):**
```bash
cd aws/deployment/scraper
./quick-deploy.sh
```

**Aktualizacja kodu:**
```bash
cd aws/deployment/scraper
./deploy.sh
```

**Test lokalny:**
```bash
cd aws/deployment/scraper
./test-local.sh
```

**Zarządzanie:**
```bash
cd aws/deployment/scraper
./management-commands.sh run-now    # Uruchom teraz
./management-commands.sh logs       # Zobacz logi
```

Zobacz `deployment/scraper/README.md` dla szczegółów.

## 🧹 Cleanup

**Usunięcie zasobów AWS (z zachowaniem RDS):**
```bash
cd aws/cleanup/scraper
./cleanup-aws.sh
```

Zobacz `cleanup/scraper/README.md` dla szczegółów.

## 📚 Dokumentacja

- `deployment/scraper/README.md` - Instrukcje deploymentu scrapera
- `deployment/scraper/DEPLOY.md` - Szczegółowa dokumentacja deployu
- `cleanup/scraper/README.md` - Dokumentacja czyszczenia zasobów

## 💰 Koszty

Po pełnym deploymencie (Scheduled Task):
- **RDS (db.t4g.micro, 20 GB)**: ~$14.80/miesiąc
- **Fargate (2 vCPU, 4GB RAM)**: ~$2.40/miesiąc (~30 × $0.08 za ~15-30 min dziennie)
- **ECR**: ~$0.10/GB/miesiąc
- **CloudWatch Logs**: ~$0.50/GB
- **EventBridge**: $0 (darmowy dla scheduled rules)
- **RAZEM**: ~$18/miesiąc

Po cleanup (tylko RDS):
- **Całkowity koszt**: ~$14.80/miesiąc

💡 **Oszczędność vs 24/7:** ~$56/miesiąc (76%!)

