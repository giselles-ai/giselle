"use server";

import { db, edges, nodes, ports } from "@/drizzle";
import { sql } from "drizzle-orm";
import type { Node, NodeGraph } from "../../nodes";

type GetDependedNodesArgs = {
	requestDbId: number;
	nodeDbId: number;
};

type DependedNode = {
	source_node_id: Node["id"];
	source_node_db_id: number;
	source_node_class_name: string;
	source_node_graph: NodeGraph;
	source_port_db_id: number;
	source_port_name: string;
	depended_node_id: Node["id"];
	depended_node_db_id: number;
	depended_node_class_name: string;
	depended_node_graph: NodeGraph;
	depended_port_db_id: number;
	depended_port_name: string;
	depth: number;
};
type AssertDependedNodes = (
	result: unknown,
) => asserts result is DependedNode[];

/** @todo */
const assertDependedNodes: AssertDependedNodes = (result) => {};

export const getDependedNodes = async ({
	requestDbId,
	nodeDbId,
}: GetDependedNodesArgs) => {
	const result = await db.execute(sql`
	WITH RECURSIVE
  node_connections AS (
    SELECT
      source_nodes.id source_node_id,
      source_nodes.db_id source_node_db_id,
      source_nodes.class_name source_node_class_name,
      source_nodes.graph source_node_graph,
      source_ports.db_id source_port_db_id,
      source_ports.name source_port_name,
      depended_nodes.id depended_node_id,
      depended_nodes.db_id depended_node_db_id,
      depended_nodes.class_name depended_node_class_name,
      depended_nodes.graph depended_node_graph,
      depended_ports.db_id depended_port_db_id,
      depended_ports.name depended_port_name,
      1 DEPTH
    FROM
      nodes source_nodes
      INNER JOIN requests ON requests.build_db_id = source_nodes.build_db_id
      INNER JOIN ports source_ports ON source_ports.node_db_id = source_nodes.db_id
      AND source_ports.type = 'data'
      AND source_ports.direction = 'target'
      INNER JOIN edges ON edges.target_port_db_id = source_ports.db_id
      INNER JOIN ports depended_ports ON depended_ports.db_id = edges.source_port_db_id
      INNER JOIN nodes depended_nodes ON depended_nodes.db_id = depended_ports.node_db_id
    WHERE
      requests.db_id = ${requestDbId}
      AND NOT EXISTS (
        SELECT
          *
        FROM
          request_port_messages
        WHERE
          request_port_messages.request_db_id = requests.db_id
          AND request_port_messages.port_db_id = depended_ports.db_id
      )
  ),
  connection_tree AS (
    SELECT
      *
    FROM
      node_connections
    WHERE
      source_node_db_id = ${nodeDbId}
    UNION ALL
    SELECT
      node_connections.source_node_id,
      node_connections.source_node_db_id,
      node_connections.source_node_class_name,
      node_connections.source_node_graph,
      node_connections.source_port_db_id,
      node_connections.source_port_name,
      node_connections.depended_node_id,
      node_connections.depended_node_db_id,
      node_connections.depended_node_class_name,
      node_connections.depended_node_graph,
      node_connections.depended_port_db_id,
      node_connections.depended_port_name,
      connection_tree.depth + 1 DEPTH
    FROM
      node_connections
      INNER JOIN connection_tree ON connection_tree.depended_node_db_id = node_connections.source_node_db_id
    WHERE
      connection_tree.depth < 10
  )
SELECT
  *
FROM
  connection_tree
ORDER BY
  DEPTH DESC
     `);
	assertDependedNodes(result.rows);
	return result.rows.map(
		({
			depended_node_id,
			depended_node_db_id,
			depended_node_class_name,
			depended_node_graph: depnded_node_graph,
		}) => ({
			id: depended_node_id,
			dbId: depended_node_db_id,
			className: depended_node_class_name,
			graph: depnded_node_graph,
		}),
	);
};
