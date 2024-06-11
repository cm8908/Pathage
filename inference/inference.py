import torch
import numpy as np
import sys
from inference import MODEL_DICT
from scipy.spatial import distance_matrix
from ortools.constraint_solver import pywrapcp, routing_enums_pb2
from concorde.tsp import TSPSolver

class Inferencer:
    def __init__(self, model_name: str, model_config: dict):
        self.model_name = model_name
        self.model_config = model_config
        self.model_type = MODEL_DICT[model_name]['type']

        if self.model_type == 'NN':
            self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
            self.model = MODEL_DICT[model_name]['instance'](**self.model_config).to(self.device)
            model_weights = MODEL_DICT[model_name]['weights'] if 'weights' in MODEL_DICT[model_name] else None
            if model_weights is not None:
                self.model.load_state_dict(torch.load(model_weights))
            self.forward = MODEL_DICT[model_name]['forward']

    # TODO: bresson and jung for n=selectable
    # TODO: add kool, yang and OPRO
    def inference(self, coordinates: np.ndarray) -> np.ndarray:
        if self.model_type == 'NN':
            return self.nn_inference(coordinates)
        elif self.model_type == 'ortools':
            return self.ortools_inference(coordinates)
        elif self.model_type == 'concorde':
            return self.concorde_inference(coordinates)
        else:
            raise NotImplementedError('Only Neural Networks are supported for now')
        
    def concorde_inference(self, coordinates):
        return TSPSolver.from_data(coordinates[:, 0], coordinates[:, 1], norm='GEO').solve().tour.astype(int)
    
    def ortools_inference(self, coordinates):
        initial_point = {
                'zero': 0, 'random': np.random.randint(0, len(coordinates))
            }[self.model_config['initial_point']]
        # Set up data & manager TODO: data range
        x = (coordinates * self.model_config['coordinate_multiplier']).astype(int)

        data = {
            'distance_matrix': distance_matrix(x, x).astype(int),
            'num_vehicles': 1,
            'depot': initial_point,
        }
        manager = pywrapcp.RoutingIndexManager(
            len(data['distance_matrix']), data['num_vehicles'], data['depot']
        )
        # Set up routing model
        routing = pywrapcp.RoutingModel(manager)
        def distance_callback(from_index, to_index):
            from_node = manager.IndexToNode(from_index)
            to_node = manager.IndexToNode(to_index)
            return data["distance_matrix"][from_node][to_node]
        transit_callback_index = routing.RegisterTransitCallback(distance_callback)
        routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)
        # Set up search parameter first solution strategy
        search_parameters = pywrapcp.DefaultRoutingSearchParameters()
        ## First Solution Strategy
        if hasattr(routing_enums_pb2.FirstSolutionStrategy, self.model_config['first_solution_strategy']):
            search_parameters.first_solution_strategy = (
                getattr(routing_enums_pb2.FirstSolutionStrategy, self.model_config['first_solution_strategy'])
            )
        else:
            search_parameters.first_solution_strategy = routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
        ## Local Search Metaheuristic
        if hasattr(routing_enums_pb2.LocalSearchMetaheuristic, self.model_config['local_search_metaheuristic']):
            search_parameters.local_search_metaheuristic = (
                getattr(routing_enums_pb2.LocalSearchMetaheuristic, self.model_config['local_search_metaheuristic'])
            )
        else:
            search_parameters.local_search_metaheuristic = routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
        ## Time Limit
        search_parameters.time_limit.seconds = self.model_config['time_limit']
        # Solve!
        solution = routing.SolveWithParameters(search_parameters)

        # Get tour
        index = routing.Start(0)
        route_distance = 0
        tour = [0]
        while not routing.IsEnd(index):
            previous_index = index
            index = solution.Value(routing.NextVar(index))
            route_distance += routing.GetArcCostForVehicle(previous_index, index, 0)
            tour.append(index)
        del tour[-1]
        return np.array(tour)
    
    def nn_inference(self, coordinates):
        def normalize(coordinates):
            if coordinates.max() > 1 or coordinates.min() < 0:
                coordinates = (coordinates - coordinates.min()) / (coordinates.max() - coordinates.min())
            return coordinates
        self.model.eval()
        with torch.no_grad():
            coordinates = torch.Tensor(coordinates).to(self.device)
            coordinates = normalize(coordinates)
            output = self.forward(self.model, coordinates[None])
            return output.cpu().numpy()[0]
    
    
        
        