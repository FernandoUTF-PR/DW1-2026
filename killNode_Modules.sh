#!/bin/bash

BASE_DIR="./"

# Lista as pastas node_modules encontradas
echo "Pastas 'node_modules' encontradas:"
find "$BASE_DIR" -type d -name "node_modules" -prune

echo ""
read -p "Tem certeza que deseja excluir TODAS as pastas node_modules? (s/N): " confirmacao

if [[ "$confirmacao" =~ ^[Ss]$ ]]; then
    find "$BASE_DIR" -type d -name "node_modules" -prune -exec rm -rf {} \; -print
    echo "Pastas removidas com sucesso!"
else
    echo "Operação cancelada."
fi
