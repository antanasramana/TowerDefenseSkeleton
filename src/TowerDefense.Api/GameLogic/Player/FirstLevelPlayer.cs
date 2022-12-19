﻿using TowerDefense.Api.GameLogic.Grid;
using TowerDefense.Api.GameLogic.PerkStorage;
using TowerDefense.Api.GameLogic.Shop;

namespace TowerDefense.Api.GameLogic.Player
{
    public class FirstLevelPlayer : IPlayer
    {
        public string ConnectionId { get; set; }
        public string Name { get; set; }
        public int Health { get; set; } = 100;
        public int Armor { get; set; } = 100;
        public int Money { get; set; } = 1000;
        public Inventory Inventory { get; set; } = new();
        public IArenaGrid ArenaGrid { get; set; } = null;
        public IShop Shop { get; set; } = null;
        public IPerkStorage PerkStorage { get; set; } = null;
    }
}
