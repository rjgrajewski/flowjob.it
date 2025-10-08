# Deployment - Aligno Scraper

Ten folder zawiera wszystkie pliki potrzebne do deployu scrapera Aligno na AWS Fargate.

## 📁 Struktura

```
aws/deployment/scraper/
├── Dockerfile                    # Obraz Docker dla scrapera
├── .dockerignore                 # Pliki ignorowane przez Docker
├── ecs-task-definition.json      # Definicja task ECS
├── deploy.sh                     # Główny skrypt deployu
├── quick-deploy.sh               # Szybki deploy (wszystkie kroki)
├── setup-iam.sh                  # Konfiguracja ról IAM
├── setup-infrastructure.sh       # Konfiguracja infrastruktury AWS
├── test-local.sh                 # Test lokalny Docker
├── management-commands.sh        # Komendy zarządzania serwisem
├── DEPLOY.md                     # Szczegółowa dokumentacja deployu
└── README.md                     # Ten plik
```

## 🚀 Szybki Start

Scraper uruchamia się jako **Scheduled Task** - raz dziennie o 2 AM UTC.

### 1. Pierwszy deploy (pełna konfiguracja):
```bash
cd aws/deployment/scraper
./quick-deploy.sh
```

### 2. Aktualizacja kodu:
```bash
cd aws/deployment/scraper
./deploy.sh
```

### 3. Test lokalny:
```bash
cd aws/deployment/scraper
./test-local.sh
```

### 4. Uruchomienie manualne (poza harmonogramem):
```bash
aws ecs run-task \
  --cluster scraper-cluster \
  --task-definition scraper \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[YOUR_SUBNET],securityGroups=[YOUR_SG],assignPublicIp=ENABLED}" \
  --region eu-central-1
```

## 📋 Wymagania

- AWS CLI skonfigurowany
- Docker zainstalowany (z obsługą multi-platform builds)
- Uprawnienia do tworzenia zasobów AWS
- ARN sekretu bazy danych w AWS Secrets Manager
- Plik `.env` w głównym katalogu projektu z wymaganymi zmiennymi:
  - `AWS_ACCOUNT_ID` - ID konta AWS
  - `AWS_REGION` - region AWS (np. eu-central-1)
  - `SECRET_ARN` - ARN sekretu w Secrets Manager

### 💻 Kompatybilność platformy

Deployment automatycznie buduje obraz Docker dla **linux/amd64** (x86_64), niezależnie od architektury Twojego komputera:
- ✅ **Apple Silicon (M1/M2/M3)**: Automatycznie cross-kompiluje do AMD64
- ✅ **Intel Mac**: Natywny build AMD64
- ✅ **Linux AMD64**: Natywny build
- ✅ **Linux ARM64**: Automatycznie cross-kompiluje do AMD64

AWS Fargate używa architektury **x86_64 (AMD64)**, więc wszystkie obrazy są budowane dla tej platformy.

## 🔧 Zarządzanie

Po deployu możesz używać komend zarządzających:

```bash
cd aws/deployment/scraper

# Zobacz logi
./management-commands.sh logs

# Status harmonogramu
./management-commands.sh schedule-status

# Uruchom task teraz (poza harmonogramem)
./management-commands.sh run-now

# Wyłącz automatyczne uruchamianie
./management-commands.sh disable-schedule

# Włącz automatyczne uruchamianie
./management-commands.sh enable-schedule

# Zatrzymaj obecnie działający task
./management-commands.sh stop-running

# Zmień harmonogram (np. na 3 AM UTC)
./management-commands.sh update-schedule 'cron(0 3 * * ? *)'
```

## 📚 Dokumentacja

- `DEPLOY.md` - Szczegółowa dokumentacja deployu
- `../../../README.md` - Dokumentacja głównego projektu
- `../../cleanup/scraper/README.md` - Dokumentacja czyszczenia zasobów AWS

## ⚠️ Uwagi

- Wszystkie skrypty muszą być uruchamiane z folderu `aws/deployment/scraper/`
- Docker build używa kontekstu z folderu głównego projektu (`../../..`)
- Konfiguracja sieciowa jest wykrywana automatycznie
