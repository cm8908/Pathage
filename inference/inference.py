import torch
from inference.jung import Jung

MODEL_DICT = {
    'jung-tsp50-m5': {
        'instance': Jung('conv', 10, 11, 2, 128, 512, 6, 2, 8, 1000, 5, True),
        'weights': 'weights/jung-tsp50-m5.pt',
        'forward': lambda model, x: model.forward(x, 0, True, False)[0],
    }
}

class Inferencer:
    def __init__(self, model_name):
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.model = MODEL_DICT[model_name]['instance'].to(self.device)
        model_weights = MODEL_DICT[model_name]['weights'] if 'weights' in MODEL_DICT[model_name] else None
        if model_weights is not None:
            self.model.load_state_dict(torch.load(model_weights))
        self.forward = MODEL_DICT[model_name]['forward']

    def inference(self, coordinates):
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
            # return 'Inference done'
    
    
        
        