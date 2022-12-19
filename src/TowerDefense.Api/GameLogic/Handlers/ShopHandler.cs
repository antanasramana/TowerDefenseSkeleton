﻿using TowerDefense.Api.GameLogic.GameState;
using TowerDefense.Api.GameLogic.Items;
using TowerDefense.Api.GameLogic.Shop;

namespace TowerDefense.Api.GameLogic.Handlers
{
    public interface IShopHandler
    {
        public IShop GetPlayerShop(string playerName);
        bool TryBuyItem(string playerName, string identifier);
    }

    public class ShopHandler : IShopHandler
    {
        private readonly State _gameState;

        public ShopHandler()
        {
            _gameState = GameOriginator.GameState;
        }

        public IShop GetPlayerShop(string playerName)
        {
            var player = _gameState.Players.First(player => player.Name == playerName);

            return player.Shop;
        }

        public bool TryBuyItem(string playerName, string identifier)
        {
            var player = _gameState.Players.First(player => player.Name == playerName);
            var item = player.Shop.Items.First(item => item.Id == identifier);

            if (item == null) return false;

            var isAbleToAfford = item.Stats.Price < player.Money;
            if (!isAbleToAfford) return false;

            player.Money -= item.Stats.Price;

            var inventoryItem = ItemHelpers.CreateItemByType(item.ItemType);
            inventoryItem.Id = Guid.NewGuid().ToString();
            player.Inventory.Items.Add(inventoryItem);

            return true;
        }
    }
}
