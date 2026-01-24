#!/bin/bash
set -a
source .env
set +a

echo "MONAD_RPC: $MONAD_RPC"
echo "Running deployment..."

~/.foundry/bin/forge script script/Deploy.s.sol --rpc-url "$MONAD_RPC" --broadcast --legacy -vvvv
