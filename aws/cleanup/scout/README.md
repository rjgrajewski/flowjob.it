# AWS Cleanup Scripts

Skrypty do czyszczenia zasobów AWS dla projektu Aligno.

## 🧹 cleanup-aws.sh

Usuwa wszystkie zasoby AWS związane z modułem Scout, **zachowując bazę danych RDS**.

### Co usuwa:

- ✅ ECS Clusters, Services i Tasks
- ✅ ECR Repositories (wraz z obrazami)
- ✅ IAM Roles i Policies
- ✅ Security Groups
- ✅ VPC, Subnets, Internet Gateways
- ✅ Route Tables
- ✅ CloudWatch Log Groups
- ✅ Task Definitions

### Co zachowuje:

- 💾 **RDS Database** - baza danych `aligno-db` pozostaje nienaruszona

### Użycie:

```bash
cd aws/cleanup/scout
./cleanup-aws.sh
```

Skrypt zapyta o potwierdzenie przed rozpoczęciem czyszczenia:
```
⚠️  This will delete everything EXCEPT the RDS database
Are you sure you want to continue? (yes/no):
```

### Funkcje:

1. **Inteligentne usuwanie Security Groups**
   - Automatycznie usuwa reguły odwołujące się do usuwanych grup
   - Obsługuje zależności między Security Groups

2. **Bezpieczne czyszczenie**
   - Zatrzymuje wszystkie running tasks przed usunięciem
   - Skaluje serwisy do 0 przed ich usunięciem
   - Detachuje Internet Gateways przed usunięciem

3. **Wielokrotne uruchamianie**
   - Bezpiecznie obsługuje sytuacje gdy zasoby już nie istnieją
   - Można uruchomić ponownie jeśli pierwsze czyszczenie nie usunęło wszystkiego

### Przykładowy output:

```
🧹 Cleaning up AWS resources for Aligno Scout...
⚠️  This will delete everything EXCEPT the RDS database

🛑 Stopping ECS tasks...
✅ Tasks stopped

🗑️  Deleting ECS services...
✅ Services deleted

🗑️  Deleting ECS cluster...
✅ Cluster deleted

...

✅ Cleanup completed!
📋 RDS database has been preserved
```

### Po czyszczeniu:

Po uruchomieniu skryptu:
- Wszystkie zasoby związane z modułem Scout zostaną usunięte
- RDS database zostanie zachowana i dostępna
- Możesz przeprowadzić świeży deployment używając `aws/deployment/scout/quick-deploy.sh`

### Koszty:

Po czyszczeniu pozostaje tylko RDS, który kosztuje około **$14.80/miesiąc**.

### Uwagi:

- ⚠️ Skrypt NIE usuwa bazy danych RDS - jeśli chcesz ją usunąć, zrób to ręcznie przez AWS Console
- 💡 Jeśli jakieś zasoby nie zostaną usunięte za pierwszym razem (np. z powodu zależności), poczekaj minutę i uruchom skrypt ponownie
- 🔐 Wymaga skonfigurowanego AWS CLI z odpowiednimi uprawnieniami

