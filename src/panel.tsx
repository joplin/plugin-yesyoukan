import * as React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";

// createRoot(document.getElementById("root")!).render(
//   <React.StrictMode>
//     <App />
//   </React.StrictMode>
// );

const rootElement = document.getElementById('root');
const root = createRoot(rootElement);
root.render(<App />);



// import ReactDOM from "react-dom";
// const Board = require("@lourenci/react-kanban");
// const { moveCard } = require("@lourenci/react-kanban");
// // import "@lourenci/react-kanban/dist/styles.css";
// // Use your own styles to override the default styles
// // import "./styles.css";

// const board = {
//   columns: [
//     {
//       id: 1,
//       title: "Open",
//       backgroundColor: "#fff",
//       cards: [
//         {
//           id: 1,
//           title: "DF-22110005",
//           description: (
//             <div>
//               <label className="description-text">Unit No :10/100</label> <br />
//               <label className="description-text">
//                 ชื่อลูกค้า : นายไอคอน เฟรมเวิร์ค
//               </label>
//               <br />
//               <label className="description-text">
//                 วันที่แจ้งเคส : 11/11/2022
//               </label>
//               <br />
//               <label className="description-text">
//                 ผู้ดูแลเคส : นายเฟรมเวิร์ค ไอคอน
//               </label>
//               <br />
//               <label className="description-text" style={{ color: "red" }}>
//                 SLA : 5 Days (OverDue)
//               </label>
//               <br />
//             </div>
//           )
//         },
//         {
//           id: 2,
//           title: "DF-22110009",
//           description: (
//             <div>
//               <label className="description-text">Unit No :10/100</label> <br />
//               <label className="description-text">
//                 ชื่อลูกค้า : นายไอคอน เฟรมเวิร์ค
//               </label>
//               <br />
//               <label className="description-text">
//                 วันที่แจ้งเคส : 16/12/2022
//               </label>
//               <br />
//               <label className="description-text">
//                 ผู้ดูแลเคส : นายเฟรมเวิร์ค ไอคอน
//               </label>
//               <br />
//               <label className="description-text" style={{ color: "red" }}>
//                 SLA : 7 Days (OverDue)
//               </label>
//               <br />
//             </div>
//           )
//         }
//       ]
//     },
//     {
//       id: 2,
//       title: "InProgress",
//       cards: [
//         {
//           id: 9,
//           title: "Card title 9",
//           description: "Card content"
//         }
//       ]
//     },
//     {
//       id: 3,
//       title: "Cancel",
//       cards: [
//         {
//           id: 10,
//           title: "Card title 10",
//           description: "Card content"
//         },
//         {
//           id: 11,
//           title: "Card title 11",
//           description: "Card content"
//         }
//       ]
//     },
//     {
//       id: 4,
//       title: "In Complete",
//       cards: [
//         {
//           id: 12,
//           title: "Card title 12",
//           description: "Card content"
//         },
//         {
//           id: 13,
//           title: "Card title 13",
//           description: "Card content"
//         }
//       ]
//     }
//   ]
// };

// function ControlledBoard() {
//   // You need to control the state yourself.
//   const [controlledBoard, setBoard] = useState(board);

//   function handleCardMove(_card, source, destination) {
//     const updatedBoard = moveCard(controlledBoard, source, destination);
//     setBoard(updatedBoard);
//   }

//   return (
//     <Board onCardDragEnd={handleCardMove} disableColumnDrag>
//       {controlledBoard}
//     </Board>
//   );
// }

// function UncontrolledBoard() {
//   return (
//     <Board
//       allowRemoveLane
//       allowRenameColumn
//       allowRemoveCard
//       onLaneRemove={console.log}
//       onCardRemove={console.log}
//       onLaneRename={console.log}
//       initialBoard={board}
//       allowAddCard={{ on: "top" }}
//       onNewCardConfirm={(draftCard) => ({
//         id: new Date().getTime(),
//         ...draftCard
//       })}
//       onCardNew={console.log}
//     />
//   );
// }

// function App() {
//   return (
//     <div style={{ backgroundColor: "hsl(240deg 65% 33%)", height: "100%" }}>
//       <UncontrolledBoard />
//     </div>
//   );
// }

// const rootElement = document.getElementById("root");
// ReactDOM.render(<App />, rootElement);




// // import * as React from 'react';
// // import { FC, useState } from 'react'
// // import { createRoot } from 'react-dom/client';
// // import { ControlledBoard, OnDragEndNotification, Card, moveCard, KanbanBoard } from '@caldwell619/react-kanban'

// // import { board } from './data'


// // // import { ControlledBoard } from '@caldwell619/react-kanban'
// // // import '@caldwell619/react-kanban/dist/styles.css' // import here for "builtin" styles

// // // const board: KanbanBoard = {
// // //   columns: [
// // //     {
// // //       id: 1,
// // //       title: 'Backlog',
// // //       cards: [
// // //         {
// // //           id: 1,
// // //           title: 'Add card',
// // //           description: 'Add capability to add a card in a column'
// // //         },
// // //       ]
// // //     },
// // //   ]
// // // };

// // const ControlledBoardDemo: FC = () => {
// //   // You need to control the state yourself.
// //   const [controlledBoard, setBoard] = useState<KanbanBoard<Card>>({ ...board })

// //   console.info('RTRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR');

// //   const handleCardMove: OnDragEndNotification<Card> = (_card, source, destination) => {
// //     setBoard(currentBoard => {
// //       return moveCard(currentBoard, source, destination)
// //     })
// //   }

// //   const onCardNew = (newCard:any) => {
// //     newCard = { id: Math.random().toString(), ...newCard }
// //     console.info('NNNNNNNNNNNNNNNNNNN', newCard);
// //     return newCard
// //   }

// //   return (
// //     <ControlledBoard
// //         onCardDragEnd={handleCardMove}
// //         onCardNew={onCardNew}
// //         disableColumnDrag
// //         children={controlledBoard}
// //         onCardRemove={({ board, card, column }) => {
// //           console.log({ board, card, column })
// //         }}
// //       >
// //     </ControlledBoard>
// //   );
// // }


// // const App = () => {
// // 	return <ControlledBoardDemo  />
// // }

// // const rootElement = document.getElementById('root');
// // const root = createRoot(rootElement);

// // root.render(<App />);
