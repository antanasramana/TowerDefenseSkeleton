import React, { useEffect, useState } from 'react';
import Money from '../money/Money';
import TowerHealth from '../tower/TowerHealth';
import TowerArmor from '../tower/TowerArmor';
import Tower from '../tower/Tower';
import Shop from '../shop/Shop';
import Inventory from '../inventory/Inventory';
import Grid from '../grid/Grid';
import EndTurnButton from '../end-turn-button/EndTurnButton';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { getEnemyInfo, setEnemyToInitial, setEnemyName } from '../player/EnemySlice';
import { setGridToInitial, getEnemyGridItems, getPlayerGridItems, executeCommand, setSelectedGridItemId, interpretCommand } from '../grid/GridSlice';
import { getPlayerInfo, setPlayerToInitial, endTurn } from '../player/PlayerSlice';
import * as signalR from '@microsoft/signalr';
import { getInventoryItems, setInventoryToInitial } from '../inventory/InventorySlice';
import { useNavigate } from 'react-router-dom';

const SIGNALR_URL = `${process.env.REACT_APP_BACKEND}/gameHub`;

import './GameArena.css';
import { EndTurnRequest } from '../../contracts/EndTurnRequest';
import { EndTurnResponse } from '../../contracts/EndTurnResponse';
import { AttackResult } from '../../models/AttackResult';
import CommandType from '../../models/CommandType';
import ItemInfo from '../info/ItemInfo';
import PerkStorage from '../perks/PerkStorage';
import { setShopToInitial } from '../shop/ShopSlice';

const GameArena: React.FC = () => {
	const dispatch = useAppDispatch();
	const navigate = useNavigate();

	// useState
	const [connection, setConnection] = useState<signalR.HubConnection>();
	const [endTurnText, setEndTurnText] = useState<string>('End turn');

	const [commandText, setCommandText] = useState<string>('');
	const [playerAttackResult, setPlayerAttackResult] = useState<AttackResult[]>([]);
	const [enemyAttackResult, setEnemyAttackResult] = useState<AttackResult[]>([]);

	// redux State
	const player = useAppSelector((state) => state.player);
	const enemy = useAppSelector((state) => state.enemy);

	// useEffect
	useEffect(() => {
		const hubConnection: signalR.HubConnection = new signalR.HubConnectionBuilder()
			.withUrl(SIGNALR_URL)
			.withAutomaticReconnect()
			.build();

		setConnection(hubConnection);
	}, []);

	useEffect(() => {
		// SignalR
		if (connection) {
			connection
				.start()
				.then(() => {
					console.log('Connected!');
					connection.invoke('JoinGame', player.name);

					connection.on('EnemyInfo', (message) => {
						dispatch(setEnemyName(message.name));
						dispatch(getEnemyGridItems());
					});
					connection.on('EndTurn', (res) => {
						const endTurnResponse: EndTurnResponse = res;
						console.log(endTurnResponse);
						setPlayerAttackResult(endTurnResponse.playerAttackResults);
						setEnemyAttackResult(endTurnResponse.enemyAttackResults);
						dispatch(getEnemyGridItems());
						dispatch(getEnemyInfo());
						dispatch(getPlayerGridItems());
						dispatch(getPlayerInfo());
						dispatch(getInventoryItems());
						setEndTurnText('End Turn');
					});				
					connection.on('ResetGame', () => {
						// reset everything
						dispatch(setEnemyToInitial());
						dispatch(setPlayerToInitial());
						dispatch(setGridToInitial());
						dispatch(setInventoryToInitial());
						dispatch(setShopToInitial());

						navigate('/');				
					});
					connection.on('GameFinished', (winnerName) => {
						const currentName = player.name;

						// reset everything
						dispatch(setEnemyToInitial());
						dispatch(setPlayerToInitial());
						dispatch(setGridToInitial());
						dispatch(setInventoryToInitial());
						dispatch(setShopToInitial());

						navigate('/game-finished', { state: { winnerName: winnerName, playerName: currentName, level: player.level }});				
					});
				})
				.catch((e) => console.log('Connection failed: ', e));
		}
	}, [connection, dispatch, player.name]);

	useEffect(() => {
		dispatch(getPlayerGridItems());
	}, []);

	// methods
	function onEndTurnClick() {
		const endTurnRequest: EndTurnRequest = {
			playerName: player.name,
		};
		setEndTurnText('Waiting...');
		dispatch(endTurn(endTurnRequest));
	}

	async function handleCommandClick(commandType: CommandType, resetGridSelection: boolean) {
		await dispatch(executeCommand(commandType));		
		dispatch(getPlayerGridItems());
		dispatch(getInventoryItems());
		dispatch(getPlayerInfo());
		if (resetGridSelection){
			dispatch(setSelectedGridItemId(-1));
		}
	}

	async function sendCommand() {
		await dispatch(interpretCommand(commandText));		
		dispatch(getPlayerInfo());
		dispatch(getInventoryItems());
	}
	return (
		<div className='root-container'>
			<div className='header'>
				<Money value={player.money}/>
				<Money value={enemy.money}/>
			</div>
			<div className='body'>
				<div className='tower-container'>
					<h1 className='name-header'>{player.name}</h1>
					<TowerArmor isEnemy={false} value={player.armor} />
					<TowerHealth isEnemy={false} value={player.health}/>
					<Tower isEnemy={false} />
				</div>
				<Grid isEnemy={false} attackResults={playerAttackResult} />
				<Grid isEnemy={true} attackResults={enemyAttackResult} />
				<div className='tower-container'>
					<h1 className='name-header'>{enemy.name}</h1>
					<TowerArmor isEnemy={true} value={enemy.armor}/>
					<TowerHealth isEnemy={true} value={enemy.health}/>
					<Tower isEnemy={true} />
				</div>
			</div>
			<div className='footer'>
				<ItemInfo/>
				<div className='controls'>
					<div className='commands'>
						<button className='command' onClick={()=>handleCommandClick(CommandType.Undo, true)}>
							Undo
						</button>
						<button className='command' onClick={()=>handleCommandClick(CommandType.Upgrade, false)}>
							Upgrade
						</button>
						<button className='command' onClick={()=>handleCommandClick(CommandType.Remove, true)}>
							Remove
						</button>
						<div>
							<input onChange={(e) => setCommandText(e.target.value)}></input>
							<button onClick={sendCommand}>Send</button>
						</div>
					</div>
					<Inventory />
					<EndTurnButton onClick={onEndTurnClick} text={endTurnText} />
					<Shop />
				</div>
				<PerkStorage/>
			</div>

		</div>
	);
};

export default GameArena;
