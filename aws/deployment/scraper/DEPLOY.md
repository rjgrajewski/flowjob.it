# Deploy Aligno Scraper to AWS Fargate

Ten dokument zawiera instrukcje do deployu scrapera Aligno na AWS Fargate.

## Wymagania

- AWS CLI skonfigurowany z odpowiednimi uprawnieniami
- Docker zainstalowany
- Baza danych PostgreSQL w AWS RDS
- AWS Secrets Manager z sekretem zawierającym `username` i `password` bazy danych
- IAM Role z uprawnieniami do ECS, ECR, CloudWatch Logs, Secrets Manager
- Plik `.env` w głównym katalogu projektu z wymaganymi zmiennymi (skopiuj z `.env.example` i uzupełnij):
  ```bash
  AWS_ACCOUNT_ID=your-aws-account-id
  AWS_REGION=eu-central-1
  SECRET_ARN=arn:aws:secretsmanager:REGION:ACCOUNT_ID:secret:your-secret-name
  AWS_DB_ENDPOINT=your-rds-endpoint.amazonaws.com
  AWS_DB_NAME=your_database_name
  AWS_DB_USERNAME=your_username
  AWS_DB_PASSWORD=your_password
  ```

## Krok 1: Przygotowanie infrastruktury

### 1.1 Utworzenie ról IAM

```bash
cd aws/deployment/scraper
chmod +x setup-iam.sh
./setup-iam.sh
```

### 1.2 Utworzenie infrastruktury sieciowej

```bash
chmod +x setup-infrastructure.sh
./setup-infrastructure.sh
```

**Uwaga:** Skrypt `deploy.sh` automatycznie wykryje i użyje utworzonej infrastruktury (VPC, subnety, security groups).

## Krok 2: Deploy aplikacji

### 2.1 Zbudowanie i pushowanie obrazu Docker

```bash
chmod +x deploy.sh
./deploy.sh
```

## Konfiguracja

### Konfiguracja sieciowa

Aplikacja wymaga następujących zasobów sieciowych:
- **VPC** - skrypt automatycznie używa domyślnego VPC lub pierwszego dostępnego
- **Subnet** - musi być w tym samym VPC (z dostępem do Internetu)
- **Security Group** - skrypt automatycznie tworzy `scraper-sg` z regułami wychodzącymi dla HTTPS, HTTP i PostgreSQL

**Uwaga:** Konfiguracja sieciowa (subnet, security group) NIE jest częścią `ecs-task-definition.json`. Jest ona podawana podczas tworzenia serwisu ECS, co robi automatycznie skrypt `deploy.sh`.

### Zmienne środowiskowe

Aplikacja używa hybrydowego podejścia do konfiguracji:

#### W ECS Task Definition (generowane z .env):
```json
{
  "AWS_REGION": "eu-central-1",
  "SECRET_ARN": "arn:aws:secretsmanager:REGION:ACCOUNT_ID:secret:your-secret-name"
}
```

**Uwaga:** Wartości są automatycznie podstawiane z pliku `.env` podczas deploymentu.

#### W pliku .env:
```bash
# Używane przez deployment scripts
AWS_ACCOUNT_ID=your-aws-account-id
AWS_REGION=eu-central-1
SECRET_ARN=arn:aws:secretsmanager:REGION:ACCOUNT_ID:secret:your-secret-name

# Używane przez aplikację (fallback jeśli Secrets Manager nie działa)
AWS_DB_ENDPOINT=your-rds-endpoint.amazonaws.com
AWS_DB_NAME=your_database_name
AWS_DB_USERNAME=your_username
AWS_DB_PASSWORD=your_password
```

### Konfiguracja bazy danych

Aplikacja używa **hybrydowego podejścia**:

- 🔐 **Username i Password** - pobierane z AWS Secrets Manager (bezpieczne)
- 📝 **Endpoint, DB Name, Region** - z pliku `.env` (nie wrażliwe)
- 🔄 **Fallback** - jeśli Secrets Manager nie działa, używa `.env`

To zapewnia:
- ✅ **Bezpieczeństwo** - wrażliwe dane w Secrets Manager
- ✅ **Elastyczność** - fallback na `.env` dla developmentu
- ✅ **Prostotę** - nie wrażliwe dane w `.env`
- ✅ **Niezawodność** - mniej punktów awarii

**Uwaga:** Sekret RDS zawiera `username` i `password`, które są pobierane przez aplikację. Pozostałe dane (endpoint, dbname) pochodzą z pliku `.env`.

## Monitorowanie

### CloudWatch Logs

Logi aplikacji są dostępne w CloudWatch pod nazwą: `/ecs/scraper`

### ECS Console

Możesz monitorować działanie serwisu w AWS ECS Console:
- Cluster: `scraper-cluster`
- Service: `scraper-service`

## Troubleshooting

### Sprawdzenie logów

```bash
aws logs tail /ecs/scraper --follow --region eu-central-1
```

### Sprawdzenie statusu serwisu

```bash
aws ecs describe-services --cluster scraper-cluster --services scraper-service --region eu-central-1
```

### Sprawdzenie zadań

```bash
aws ecs list-tasks --cluster scraper-cluster --service-name scraper-service --region eu-central-1
```

## Koszty

Szacunkowe koszty dla konfiguracji:
- Fargate: ~$0.04/godzina (1 vCPU, 2GB RAM)
- ECR: ~$0.10/GB/miesiąc
- CloudWatch Logs: ~$0.50/GB

## Bezpieczeństwo

- Aplikacja używa IAM ról z minimalnymi uprawnieniami
- Dane bazy danych są przekazywane przez zmienne środowiskowe ECS
- Kontener działa jako non-root user
- Sieć jest skonfigurowana z odpowiednimi security groups
