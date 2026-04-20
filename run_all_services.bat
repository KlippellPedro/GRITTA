@echo off
title GR!TTA - Microservices Manager
echo ==========================================
echo    INICIANDO MICROSSERVICOS GR!TTA
echo ==========================================

:: Inicia o Auth Service na porta 5005
start "Auth Service (5005)" cmd /k "cd services/auth_service && python run.py"

:: Inicia o User Service na porta 5001
start "User Service (5001)" cmd /k "cd services/user_service && python run.py"

:: Inicia o Order Service na porta 5002
start "Order Service (5002)" cmd /k "cd services/order_service && python run.py"

:: Inicia o Catalog Service na porta 5003
start "Catalog Service (5003)" cmd /k "cd services/catalog_service && python run.py"

:: Inicia o Inventory Service na porta 5004
start "Inventory Service (5004)" cmd /k "cd services/inventory_service && python run.py"

:: Inicia o Payment Service na porta 5006
start "Payment Service (5006)" cmd /k "cd services/payment_service && python run.py"

:: Inicia o Notification Service na porta 5007
start "Notification Service (5007)" cmd /k "cd services/notification_service && python run.py"

echo Todos os servicos estao sendo carregados...
pause