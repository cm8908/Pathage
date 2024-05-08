import pandas as pd
import json
import plotly
import plotly.graph_objs as go

def draw_tour(coordinates):
    # TODO: Implement drawing tour using plotly (or other interactive plot)
    fig = go.Figure(
        data=go.Scatter(x=coordinates[:,0], y=coordinates[:,1], mode='lines+markers',
                        marker=dict(size=10, color='red'),
                        line=dict(color='black')),
        layout=go.Layout(title=f'Result tour for {len(coordinates)} cities', showlegend=False)
    )
    fig.add_trace(go.Scatter(x=[coordinates[-1][0], coordinates[0][0]], y=[coordinates[-1][1], coordinates[0][1]], mode='lines', line=dict(color='black')))
    # for i in range(len(coordinates)-1):
    #     fig.add_trace(go.
    graph_json = json.dumps(fig, cls=plotly.utils.PlotlyJSONEncoder)
    return graph_json
    # plt.figure()
    # plt.scatter(coordinates[:,0], coordinates[:,1], color='red')
    # for i in range(len(coordinates)-1):
    #     xs = [coordinates[i][0], coordinates[i+1][0]]
    #     ys = [coordinates[i][1], coordinates[i+1][1]]
    #     plt.plot(xs, ys, color='black')
    # plt.plot([coordinates[-1][0], coordinates[0][0]], [coordinates[-1][1], coordinates[0][1]], color='black')
    # plt.title(f'Result tour for {len(coordinates)} cities')
    # img = io.BytesIO()
    # plt.savefig(img, format='png')
    # img.seek(0)
    # plt.close()
    # plot_url = base64.b64encode(img.getvalue()).decode()
    # return plot_url

def read_coordinates(file):
    return pd.read_csv(file).to_numpy()  # only supports .csv for now

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ['csv']