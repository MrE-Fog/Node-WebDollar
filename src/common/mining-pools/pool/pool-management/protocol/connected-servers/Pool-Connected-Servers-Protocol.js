import NodesWaitlist from 'node/lists/waitlist/Nodes-Waitlist'
import NodesList from 'node/lists/Nodes-List';
import NODE_TYPE from "node/lists/types/Node-Type";
import NODE_CONSENSUS_TYPE from "node/lists/types/Node-Consensus-Type"
import PoolsUtils from "common/mining-pools/common/Pools-Utils"

class PoolConnectedServersProtocol{

    constructor(poolManagement){

        this.poolManagement = poolManagement;

    }

    async insertServersListWaitlist(serversListArray){

        return await PoolsUtils.insertServersListWaitlist(serversListArray, NODE_CONSENSUS_TYPE.NODE_CONSENSUS_SERVER_FOR_POOL );

    }

    startPoolConnectedServersProtocol(){

        NodesList.emitter.on("nodes-list/connected", async (nodesListObject) => {
            await this._subscribePoolConnectedServer(nodesListObject)
        });

    }

    async _subscribePoolConnectedServer(nodesListObject){

        let socket = nodesListObject.socket;

        try{

            if ( socket.node.protocol.nodeType === NODE_TYPE.NODE_TERMINAL && socket.node.protocol.nodeConsensusType === NODE_CONSENSUS_TYPE.NODE_CONSENSUS_SERVER ){

                let answer = await this._registerPoolToServerPool(socket);

                if (!answer)
                    socket.disconnect();

            }

        } catch (exception){

            console.error("PoolConnectedServersProtocol raised an error", exception);
            socket.disconnect();

        }


    }

    async _registerPoolToServerPool(socket) {

        let answer = await socket.sendRequestWaitOnce("server-pool/register-pool", {
            poolName: this.poolManagement.poolSettings.poolName,
            poolFee: this.poolManagement.poolSettings.poolFee,
            poolWebsite: this.poolManagement.poolSettings.poolWebsite,
            poolPublicKey: this.poolManagement.poolSettings.poolPublicKey,
        });

        //TODO make a confirmation using a digital signature

        if (answer !== null && answer.result === true && typeof answer.serverFee === "number" ) {

            socket.node.protocol.serverProol = {
                serverFee: answer.serverFee,
            };

            socket.node.protocol.nodeConsensusType = NODE_CONSENSUS_TYPE.NODE_CONSENSUS_SERVER_FOR_POOL;

        } else {
            socket.disconnect();
        }

    }

}

export default PoolConnectedServersProtocol;